import ResponseHandler, {
  ResponseHandlerResult,
  getContentType
} from "./ResponseHandler";
import { Response } from "puppeteer-core";
import FileWriter from "./FileWriter";

const FALLBACK_CONTENT_TYPE = "application/octet-stream";

export default class AnyResponseHandler implements ResponseHandler {
  constructor(private readonly fileWriter: FileWriter) {}
  async handleResponse(
    response: Response,
    writePath: string
  ): Promise<ResponseHandlerResult> {
    try {
      const contentType = getContentType(response) ?? FALLBACK_CONTENT_TYPE;
      const output = await response.buffer();
      console.log(`Length of ${response.url()}: ${output.length}`);
      await this.fileWriter.writeFile(writePath, contentType, output);
      return { handled: true };
    } catch (err) {
      console.error(
        `Error in AnyResponseHandler for ${response.url()}: ${err}`
      );
      return { handled: false };
    }
  }
}
