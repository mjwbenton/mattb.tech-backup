import ResponseHandler, {
  ResponseHandlerResult,
  getContentType,
} from "./ResponseHandler";
import { Response } from "puppeteer-core";
import ContentEditor from "./ContentEditor";
import FileWriter from "./FileWriter";
import { Logger } from "winston";

const TEXT_CONTENT_TYPES = [
  "application/javascript",
  "application/json",
  "text/css",
  "text/html",
];

export default class TextResponseHandler implements ResponseHandler {
  private readonly logger: Logger;

  constructor(
    private readonly fileWriter: FileWriter,
    private readonly contentEditor: ContentEditor,
    parentLogger: Logger
  ) {
    this.logger = parentLogger.child({
      source: "TextResponseHandler",
    });
  }

  async handleResponse(
    response: Response,
    writePath: string
  ): Promise<ResponseHandlerResult> {
    try {
      const contentType = getContentType(response);
      if (
        !TEXT_CONTENT_TYPES.some((textContentType) =>
          contentType?.startsWith(textContentType)
        )
      ) {
        return { handled: false };
      }
      const text = await response.text();
      if (text.length === 0) {
        this.logger.warn("Ignoring 0B response", {
          url: response.url(),
          path: writePath,
          size: 0,
        });
        return { handled: true };
      }
      const output = this.contentEditor.editContent(text);
      this.logger.debug("Initial length", {
        url: response.url(),
        path: writePath,
        size: output.length,
      });
      await this.fileWriter.writeFile(writePath, contentType, output);
      return { handled: true };
    } catch (err) {
      this.logger.error("Error in TextResponseHandler", {
        error: err,
        url: response.url(),
        path: writePath,
      });
      return { handled: false };
    }
  }
}
