import PathRewriter from "./PathRewriter";

export default class CombinedPathRewriter implements PathRewriter {
  constructor(private readonly rewriters: Array<PathRewriter>) {}

  rewritePath(url: string): string {
    const rewriter = this.rewriters.find((rewriter) =>
      rewriter.willHandle(url)
    );
    if (!rewriter) {
      throw new Error(`No matching rewriter for url: "${url}"`);
    }
    return rewriter.rewritePath(url);
  }

  willHandle(url: string): boolean {
    return this.rewriters.some((rewriter) => rewriter.willHandle(url));
  }
}
