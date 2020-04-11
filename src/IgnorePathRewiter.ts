import PathRewriter from "./PathRewriter";

export default class IgnorePathRewriter implements PathRewriter {
  constructor(private readonly base: string) {}

  rewritePath(_: string): string | null {
    return null;
  }

  willHandle(url: string): boolean {
    return url.startsWith(this.base);
  }
}
