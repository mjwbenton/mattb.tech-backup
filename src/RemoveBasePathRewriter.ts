import PathRewriter from "./PathRewriter";

export default class RemoveBasePathRewriter implements PathRewriter {
  constructor(private readonly base: string) {}

  rewritePath(url: string): string {
    return url.substr(this.base.length) || "index.html";
  }

  willHandle(url: string): boolean {
    return url.startsWith(this.base);
  }
}
