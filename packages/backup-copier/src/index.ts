import { S3 } from "aws-sdk";
import winston from "winston";
import { MESSAGE } from "triple-beam";
import { Context } from "aws-lambda";

const FROM = "1970-01-01T00:00:00Z";
const TO = "current";
const BUCKET = "mattbtechbackup-backupbucket26b8e51c-s3mkg5h2yjo2";

const LOGGER = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(info => {
      return `${info.timestamp} ${info.requestId} ${info.level.toUpperCase()} ${
        info[MESSAGE]
      }`;
    })
  ),
  defaultMeta: { service: "mattb.tech-backup-copier" },
  transports: [new winston.transports.Console({ level: "debug" })]
});

const s3 = new S3();

async function listAllKeys(
  bucket: string,
  prefix: string,
  continuationToken?: string
): Promise<Array<string>> {
  const response = await s3
    .listObjectsV2({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken
    })
    .promise();
  const keys = response.Contents.map(object => object.Key);
  if (response.IsTruncated) {
    return keys.concat(
      await listAllKeys(bucket, prefix, response.ContinuationToken)
    );
  } else {
    return keys;
  }
}

export async function handler(_: never, context: Context) {
  const logger = LOGGER.child({
    requestId: context.awsRequestId,
    functionVersion: context.functionVersion
  });

  const newKeys = await listAllKeys(BUCKET, FROM);
  const oldKeys = await listAllKeys(BUCKET, TO);
  await Promise.all(
    oldKeys.map(key => s3.deleteObject({ Bucket: BUCKET, Key: key }).promise())
  );
  await Promise.all(
    newKeys.map(async sourceKey => {
      const params = {
        Bucket: BUCKET,
        Key: TO + sourceKey.substr(FROM.length),
        CopySource: BUCKET + "/" + sourceKey
      };
      try {
        await s3.copyObject(params).promise();
      } catch (error) {
        logger.error(`Error copying file`, {
          error,
          bucket: params.Bucket,
          key: params.Key,
          sourceKey: sourceKey
        });
      }
    })
  );
}
