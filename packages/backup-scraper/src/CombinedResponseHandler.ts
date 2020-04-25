import { Response } from "puppeteer-core";
import PathRewriter from "./PathRewriter";
import ResponseHandler from "./ResponseHandler";
import { Logger } from "winston";

export default class CombinedResponseHandler {
  private readonly logger: Logger;

  constructor(
    private readonly pathRewriter: PathRewriter,
    private readonly responseHandlers: Array<ResponseHandler>,
    parentLogger: Logger
  ) {
    this.logger = parentLogger.child({
      source: "CombinedResponseHandler"
    });
  }
  async handleResponse(response: Response) {
    const rewriterPath = this.pathRewriter.rewritePath(response.url());
    if (!rewriterPath) {
      this.logger.warn("Ignoring url as not handled by pathRewriter", {
        url: response.url()
      });
      return;
    }
    for (const responseHandler of this.responseHandlers) {
      const result = await responseHandler.handleResponse(
        response,
        rewriterPath
      );
      if (result.handled) {
        return;
      }
    }
    this.logger.error("Nothing handled response", { url: response.url() });
  }
}
