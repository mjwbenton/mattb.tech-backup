import ResponseHandler, {
  ResponseHandlerResult,
  getContentType
} from "./ResponseHandler";
import { Response } from "puppeteer-core";
import PathRewriter from "./PathRewriter";
import fetch from "node-fetch";
import FileWriter from "./FileWriter";
import { Logger } from "winston";

const RESPONSE = { handled: false };
const CONTENT_TYPE = "application/octet-stream";

/**
 * Strange "ResponseHandler". When it gets a response that is a Javascript file, it tries to
 * grab any related SourceMap which may exist. Always returns that it hasn't handled the response
 * as it doesn't actually handle the response for the javascript.
 */
export default class SourcemapResponseHandler implements ResponseHandler {
  private readonly logger: Logger;

  constructor(
    private readonly fileWriter: FileWriter,
    private readonly pathRewriter: PathRewriter,
    parentLogger: Logger
  ) {
    this.logger = parentLogger.child({
      source: "SourcemapResponseHandler"
    });
  }

  async handleResponse(
    response: Response,
    _: never
  ): Promise<ResponseHandlerResult> {
    if (getContentType(response) !== "application/javascript") {
      return RESPONSE;
    }
    const url = response.url();
    const potentialSourcemap = `${response.url()}.map`;
    const rewriterPath = this.pathRewriter.rewritePath(potentialSourcemap);
    if (!rewriterPath) {
      return RESPONSE;
    }
    try {
      this.logger.debug("Attempting to fetch sourcemap", { url });
      const fetchResponse = await fetch(potentialSourcemap);
      await this.fileWriter.writeFile(
        rewriterPath,
        CONTENT_TYPE,
        await fetchResponse.buffer()
      );
    } catch (err) {
      this.logger.warn("Failed to get sourcemap", { url });
    }
    return RESPONSE;
  }
}
