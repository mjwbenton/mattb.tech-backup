import ResponseHandler, {
  ResponseHandlerResult,
  getContentType,
} from "./ResponseHandler";
import { Response } from "puppeteer-core";
import FileWriter from "./FileWriter";
import { Logger } from "winston";

const FALLBACK_CONTENT_TYPE = "application/octet-stream";

export default class AnyResponseHandler implements ResponseHandler {
  private readonly logger: Logger;
  constructor(private readonly fileWriter: FileWriter, parentLogger: Logger) {
    this.logger = parentLogger.child({
      source: "AnyResponseHandler",
    });
  }
  async handleResponse(
    response: Response,
    writePath: string
  ): Promise<ResponseHandlerResult> {
    try {
      const contentType = getContentType(response) ?? FALLBACK_CONTENT_TYPE;
      const output = await response.buffer();
      this.logger.debug("Handling response", {
        url: response.url(),
        path: writePath,
        size: output.length,
      });
      await this.fileWriter.writeFile(writePath, contentType, output);
      return { handled: true };
    } catch (error) {
      this.logger.error("Error handling response", {
        url: response.url(),
        path: writePath,
        error,
      });
      return { handled: false };
    }
  }
}
