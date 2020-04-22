import ResponseHandler, {
  ResponseHandlerResult,
  getContentType
} from "./ResponseHandler";
import { Response } from "puppeteer-core";
import ContentEditor from "./ContentEditor";
import FileWriter from './FileWriter';

const TEXT_CONTENT_TYPES = [
  "application/javascript",
  "application/json",
  "text/css",
  "text/html"
];

export default class TextResponseHandler implements ResponseHandler {
  constructor(private readonly fileWriter: FileWriter, private readonly contentEditor: ContentEditor) {}

  async handleResponse(
    response: Response,
    writePath: string
  ): Promise<ResponseHandlerResult> {
    try {
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
      await this.fileWriter.writeFile(writePath, contentType, output);
      return { handled: true };
    } catch (err) {
      console.error(`Error in TextResponseHandler for url ${response.url()}: ${err}`);
      return { handled: false };
    }
  }
}
