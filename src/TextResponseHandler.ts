import ResponseHandler, {
  ResponseHandlerResult,
  getContentType
} from "./ResponseHandler";
import { Response } from "puppeteer";
import ContentEditor from "./ContentEditor";
import * as fs from "fs";
import { promisify } from "util";
import mkdirp from "mkdirp";
import path from "path";

const writeFile = promisify(fs.writeFile);

const TEXT_CONTENT_TYPES = [
  "application/javascript",
  "application/json",
  "text/css",
  "text/html"
];

export default class TextResponseHandler implements ResponseHandler {
  constructor(private readonly contentEditor: ContentEditor) {}

  async handleResponse(
    response: Response,
    writePath: string
  ): Promise<ResponseHandlerResult> {
    const contentType = getContentType(response);
    if (
      !TEXT_CONTENT_TYPES.some(textContentType =>
        contentType?.startsWith(textContentType)
      )
    ) {
      return { handled: false };
    }
    const text = await response.text();
    if (text.length === 0) {
      console.log(`Ignoring 0B response for url ${response.url()}`);
      return { handled: true };
    }
    const output = this.contentEditor.editContent(text);
    console.log(
      `Initial length for ${response.url()}: ${text.length}, output length: ${
        output.length
      }`
    );
    await mkdirp(path.parse(writePath).dir);
    await writeFile(writePath, output);
    return { handled: true };
  }
}