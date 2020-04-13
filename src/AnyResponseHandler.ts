import ResponseHandler, { ResponseHandlerResult } from "./ResponseHandler";
import { Response } from "puppeteer";
import mkdirp from "mkdirp";
import * as fs from "fs";
import { promisify } from "util";
import path from "path";

const writeFile = promisify(fs.writeFile);

export default class AnyResponseHandler implements ResponseHandler {
  async handleResponse(
    response: Response,
    writePath: string
  ): Promise<ResponseHandlerResult> {
    try {
      const output = await response.buffer();
      console.log(`Length of ${response.url()}: ${output.length}`);
      await mkdirp(path.parse(writePath).dir);
      await writeFile(writePath, output);
      return { handled: true };
    } catch (err) {
      console.error(`Error in handlResponse for ${response.url()}: ${err}`);
      return { handled: false };
    }
  }
}
