import { S3 } from "aws-sdk";
import winston from "winston";
import { MESSAGE } from "triple-beam";
import { Context } from "aws-lambda";

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

export async function handler(
  { prefix }: { prefix: string },
  context: Context
) {
  const logger = LOGGER.child({
    requestId: context.awsRequestId,
    functionVersion: context.functionVersion
  });

  const bucket = process.env.BACKUP_BUCKET;
  const to = process.env.CURRENT_PATH;

  const newKeys = await listAllKeys(bucket, prefix);
  const oldKeys = await listAllKeys(bucket, to);
  await Promise.all(
    oldKeys.map(key => s3.deleteObject({ Bucket: bucket, Key: key }).promise())
  );
  await Promise.all(
    newKeys.map(async sourceKey => {
      const params = {
        Bucket: bucket,
        Key: to + sourceKey.substr(prefix.length),
        CopySource: bucket + "/" + sourceKey
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
