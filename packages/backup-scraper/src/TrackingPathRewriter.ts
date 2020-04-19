import PathRewriter from "./PathRewriter";

export class TrackingPathRewriter implements PathRewriter {
  private readonly urls: Set<string>;
  private readonly rewrites: Set<string>;

  constructor(private readonly actualRewriter: PathRewriter) {
    this.urls = new Set();
    this.rewrites = new Set();
  }

  rewritePath(url: string): string {
    const result = this.actualRewriter.rewritePath(url);
    if (result !== null && !this.urls.has(url) && this.rewrites.has(result)) {
      console.error(
        `Two URLs being written to same location: "${result}" (second url "${url}")`
      );
    }
    this.urls.add(url);
    this.rewrites.add(result);
    return result;
  }

  willHandle(url: string): boolean {
    return this.actualRewriter.willHandle(url);
  }
}
