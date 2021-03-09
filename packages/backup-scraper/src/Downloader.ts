import { Logger } from "winston";
import FileWriter from "./FileWriter";
import PathRewriter from "./PathRewriter";
import fetch from "node-fetch";

const EXTENSION_TO_CONTENT_TYPE = {
  pdf: "application/pdf",
};

export default class Downloader {
  private readonly logger: Logger;

  constructor(
    private readonly fileWriter: FileWriter,
    private readonly pathRewriter: PathRewriter,
    parentLogger: Logger
  ) {
    this.logger = parentLogger.child({
      source: "Downloader",
    });
  }
  async handleUrl(url: string): Promise<void> {
    this.logger.debug("Attempting to download file", { url });
    const extension = url.split(".").pop();
    if (!EXTENSION_TO_CONTENT_TYPE[extension]) {
      this.logger.warn("Asked to download unsupported extension", { url });
    } else {
      const contentType = EXTENSION_TO_CONTENT_TYPE[extension];
      try {
        const fetchResponse = await fetch(url);
        const rewriterPath = this.pathRewriter.rewritePath(url);
        await this.fileWriter.writeFile(
          rewriterPath,
          contentType,
          await fetchResponse.buffer()
        );
      } catch (err) {
        this.logger.warn("Failed to download file", { url });
      }
    }
  }

  willHandle(url: string): boolean {
    return EXTENSION_TO_CONTENT_TYPE.hasOwnProperty(url.split(".").pop());
  }
}
