import ResponseHandler, { ResponseHandlerResult } from "./ResponseHandler";
import { Response } from "puppeteer";
import FileWriter from "./FileWriter";

export default class AnyResponseHandler implements ResponseHandler {
  constructor(private readonly fileWriter: FileWriter) {}
  async handleResponse(
    response: Response,
    writePath: string
  ): Promise<ResponseHandlerResult> {
    try {
      const output = await response.buffer();
      console.log(`Length of ${response.url()}: ${output.length}`);
      await this.fileWriter.writeFile(writePath, output);
      return { handled: true };
    } catch (err) {
      console.error(
        `Error in AnyResponseHandler for ${response.url()}: ${err}`
      );
      return { handled: false };
    }
  }
}
