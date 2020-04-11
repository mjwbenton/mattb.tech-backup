import PathRewriter from "./PathRewriter";

export default class CombinedPathRewriter implements PathRewriter {
  constructor(private readonly rewriters: Array<PathRewriter>) {}

  rewritePath(url: string): string {
    for (const rewriter of this.rewriters) {
      if (rewriter.willHandle(url)) {
        return rewriter.rewritePath(url);
      }
    }
    throw new Error(`No matching rewriter for url: "${url}"`);
  }

  willHandle(_: string): boolean {
    return true;
  }
}
