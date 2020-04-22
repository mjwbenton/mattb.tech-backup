import { Response } from "puppeteer-core";
import PathRewriter from "./PathRewriter";
import ResponseHandler from "./ResponseHandler";

export default class CombinedResponseHandler {
  constructor(
    private readonly pathRewriter: PathRewriter,
    private readonly responseHandlers: Array<ResponseHandler>
  ) {}
  async handleResponse(response: Response) {
    const rewriterPath = this.pathRewriter.rewritePath(response.url());
    if (!rewriterPath) {
      console.warn(
        `Ignoring url ${response.url()} in ResponseHandler as not handled by pathRewriter`
      );
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
    console.error(`Nothing handled response from url: ${response.url()}`);
  }
}
