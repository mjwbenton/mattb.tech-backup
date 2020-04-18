import ResponseHandler, {
  ResponseHandlerResult,
  getContentType
} from "./ResponseHandler";
import { Response } from "puppeteer";
import PathRewriter from "./PathRewriter";
import path from "path";
import fetch from "node-fetch";
import FileWriter from "./FileWriter";

const RESPONSE = { handled: false };

/**
 * Strange "ResponseHandler". When it gets a response that is a Javascript file, it tries to
 * grab any related SourceMap which may exist. Always returns that it hasn't handled the response
 * as it doesn't actually handle the response for the javascript.
 */
export default class SourcemapResponseHandler implements ResponseHandler {
  constructor(
    private readonly fileWriter: FileWriter,
    private readonly pathRewriter: PathRewriter,
    private readonly outputPath: string
  ) {}

  async handleResponse(
    response: Response,
    _: never
  ): Promise<ResponseHandlerResult> {
    if (getContentType(response) !== "application/javascript") {
      return RESPONSE;
    }
    const potentialSourcemap = `${response.url()}.map`;
    const rewriterPath = this.pathRewriter.rewritePath(potentialSourcemap);
    if (!rewriterPath) {
      return RESPONSE;
    }
    const savePath = path.join(this.outputPath, rewriterPath);
    try {
      const fetchResponse = await fetch(potentialSourcemap);
      await this.fileWriter.writeFile(savePath, await fetchResponse.buffer());
    } catch (err) {
      console.warn(`Failed to get sourcemap ${potentialSourcemap}: ${err}`);
    }
    return RESPONSE;
  }
}
