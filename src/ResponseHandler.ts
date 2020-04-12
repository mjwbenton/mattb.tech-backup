import { Response } from "puppeteer";
import PathRewriter from "./PathRewriter";
import ContentEditor from "./ContentEditor";
import mkdirp from "mkdirp";
import * as fs from "fs";
import { promisify } from "util";
import path from "path";
import fetch from "node-fetch";

const writeFile = promisify(fs.writeFile);
const OUTPUT_PATH = path.normalize(path.join(__dirname, "..", "output"));

const REWRITE_CONTENT_TYPES = [
  "application/javascript",
  "application/json",
  "text/css",
  "text/html"
];

export default class ResponseHandler {
  constructor(
    private readonly pathRewriter: PathRewriter,
    private readonly contentEditor: ContentEditor
  ) {}
  async handleResponse(response: Response) {
    try {
      const rewriterPath = this.pathRewriter.rewritePath(response.url());
      if (!rewriterPath) {
        console.warn(
          `Ignoring url ${response.url()} in ResponseHandler as not handled by pathRewriter`
        );
        return;
      }
      let output: Buffer | string;
      if (
        REWRITE_CONTENT_TYPES.some(contentType =>
          response.headers()["content-type"].startsWith(contentType)
        )
      ) {
        const text = await response.text();
        if (text.length === 0) {
          console.log(`Ignoring 0B response for url ${response.url()}`);
          return;
        }
        output = this.contentEditor.editContent(text);
        console.log(
          `Initial length for ${response.url()}: ${
            text.length
          }, output length: ${output.length}`
        );
      } else {
        output = await response.buffer();
        console.log(`Length of ${response.url()}: ${output.length}`);
      }
      console.log(
        `Handling response for ${response.url()} in ResponseHandler (status: ${response.status()}, content-type: ${
          response.headers()["content-type"]
        })`
      );
      const savePath = path.join(OUTPUT_PATH, rewriterPath);
      await mkdirp(path.parse(savePath).dir);
      await writeFile(savePath, output);
      if (response.url().endsWith(".js")) {
        const potentialSourcemap = `${response.url()}.map`;
        const rewriterPath = this.pathRewriter.rewritePath(potentialSourcemap);
        const savePath = path.join(OUTPUT_PATH, rewriterPath);
        if (rewriterPath) {
          try {
            const fetchResponse = await fetch(potentialSourcemap);
            await mkdirp(path.parse(rewriterPath).dir);
            await writeFile(savePath, await fetchResponse.buffer());
          } catch (err) {
            console.warn(
              `Failed to get sourcemap ${potentialSourcemap}: ${err}`
            );
          }
        }
      }
    } catch (err) {
      console.error(`Error in handlResponse for ${response.url()}: ${err}`);
    }
  }
}
