import path from "path";
import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as route53 from "@aws-cdk/aws-route53";
import * as route53targets from "@aws-cdk/aws-route53-targets";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as events from "@aws-cdk/aws-events";
import * as eventsTargets from "@aws-cdk/aws-events-targets";
import * as stepFunctions from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as logs from "@aws-cdk/aws-logs";
import * as cloudwatch from "@aws-cdk/aws-cloudwatch";
import * as alarmActions from "@aws-cdk/aws-cloudwatch-actions";
import * as sns from "@aws-cdk/aws-sns";
import { Duration } from "@aws-cdk/core";

const ZONE_NAME = "mattb.tech";
const DOMAIN_NAME = "backup.mattb.tech";
const HOSTED_ZONE_ID = "Z2GPSB1CDK86DH";
const CURRENT_PATH = "current";
const ALARM_TOPIC = "arn:aws:sns:us-east-1:858777967843:general-alarms";

export default class BackupStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: HOSTED_ZONE_ID,
        zoneName: ZONE_NAME
      }
    );

    const backupBucket = new s3.Bucket(this, "BackupBucket");

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "OriginAccessIdentity"
    );
    backupBucket.grantRead(
      new iam.CanonicalUserPrincipal(
        originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
      )
    );

    const certificate = new acm.DnsValidatedCertificate(this, "Certificate", {
      domainName: DOMAIN_NAME,
      hostedZone: hostedZone
    });

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        originConfigs: [
          {
            behaviors: [
              {
                isDefaultBehavior: true,
                defaultTtl: cdk.Duration.minutes(5),
                compress: true,
                allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD,
                cachedMethods:
                  cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD,
                forwardedValues: {
                  cookies: { forward: "none" },
                  queryString: true
                }
              }
            ],
            originPath: "/" + CURRENT_PATH,
            s3OriginSource: {
              s3BucketSource: backupBucket,
              originAccessIdentity
            }
          }
        ],
        viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
          certificate,
          {
            aliases: [DOMAIN_NAME]
          }
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    );

    new route53.ARecord(this, "DomainRecord", {
      zone: hostedZone,
      recordName: DOMAIN_NAME,
      ttl: cdk.Duration.minutes(5),
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(distribution)
      )
    });

    const scraperFunction = new lambda.Function(this, "Scraper", {
      code: new lambda.AssetCode(path.join(__dirname, "../../backup-scraper")),
      handler: "src/index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 3008,
      timeout: cdk.Duration.minutes(10)
    });
    scraperFunction.addEnvironment("BACKUP_BUCKET", backupBucket.bucketName);
    backupBucket.grantWrite(scraperFunction);

    const copierFunction = new lambda.Function(this, "Copier", {
      code: new lambda.AssetCode(path.join(__dirname, "../../backup-copier")),
      handler: "src/index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 1024,
      timeout: cdk.Duration.minutes(10)
    });
    copierFunction.addEnvironment("BACKUP_BUCKET", backupBucket.bucketName);
    copierFunction.addEnvironment("CURRENT_PATH", CURRENT_PATH);
    backupBucket.grantReadWrite(copierFunction);

    const scraperTask = new stepFunctions.Task(this, "ScraperTask", {
      task: new tasks.InvokeFunction(scraperFunction)
    });

    const copierTask = new stepFunctions.Task(this, "CopierTask", {
      task: new tasks.InvokeFunction(copierFunction)
    });

    const stateMachine = new stepFunctions.StateMachine(this, "StateMachine", {
      definition: stepFunctions.Chain.start(scraperTask).next(copierTask),
      logs: {
        destination: new logs.LogGroup(this, "StateMachineLogGroup"),
        level: stepFunctions.LogLevel.ALL
      }
    });

    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.rate(Duration.days(1))
    });
    rule.addTarget(new eventsTargets.SfnStateMachine(stateMachine));

    new cloudwatch.Alarm(this, "FailureAlarm", {
      metric: stateMachine.metricFailed(),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
    }).addAlarmAction(
      new alarmActions.SnsAction(
        sns.Topic.fromTopicArn(this, "AlarmTopic", ALARM_TOPIC)
      )
    );
  }
}
