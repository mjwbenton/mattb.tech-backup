import path from "path";
import FileWriter from "./FileWriter";
import { S3 } from "aws-sdk";

export default class S3FileWriter implements FileWriter {
  constructor(
    private readonly s3: S3,
    private readonly bucket: string,
    private readonly outputPath: string
  ) {}
  async writeFile(
    savePath: string,
    contentType: string,
    contents: string | Buffer
  ): Promise<void> {
    const fullPath = path.normalize(path.join(this.outputPath, savePath));
    await this.s3
      .upload({
        Bucket: this.bucket,
        Key: fullPath,
        Body: contents,
        ContentType: contentType,
      })
      .promise();
  }
}
