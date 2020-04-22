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
import { Duration } from "@aws-cdk/core";

const ZONE_NAME = "mattb.tech";
const DOMAIN_NAME = "backup.mattb.tech";
const HOSTED_ZONE_ID = "Z2GPSB1CDK86DH";

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
            originPath: "/current",
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

    const lambdaFunction = new lambda.Function(this, "LambdaFunction", {
      code: new lambda.AssetCode(path.join(__dirname, "../../backup-scraper")),
      handler: "src/index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 3008,
      timeout: cdk.Duration.minutes(10)
    });
    lambdaFunction.addEnvironment("BACKUP_BUCKET", backupBucket.bucketName);
    backupBucket.grantWrite(lambdaFunction);

    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.rate(Duration.days(1))
    });
    rule.addTarget(new eventsTargets.LambdaFunction(lambdaFunction));
  }
}
