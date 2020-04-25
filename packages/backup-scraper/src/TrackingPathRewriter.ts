import PathRewriter from "./PathRewriter";
import { Logger } from "winston";

export class TrackingPathRewriter implements PathRewriter {
  private readonly urls: Set<string>;
  private readonly rewrites: Set<string>;
  private readonly logger: Logger;

  constructor(
    private readonly actualRewriter: PathRewriter,
    parentLogger: Logger
  ) {
    this.urls = new Set();
    this.rewrites = new Set();
    this.logger = parentLogger.child({
      source: "TrackingPathRewriter"
    });
  }

  rewritePath(url: string): string {
    const result = this.actualRewriter.rewritePath(url);
    if (result !== null && !this.urls.has(url) && this.rewrites.has(result)) {
      this.logger.error("Two urls being written to same location", {
        url,
        path: result
      });
    }
    this.urls.add(url);
    this.rewrites.add(result);
    return result;
  }

  willHandle(url: string): boolean {
    return this.actualRewriter.willHandle(url);
  }
}
