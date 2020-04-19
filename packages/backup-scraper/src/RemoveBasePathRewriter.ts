import PathRewriter from "./PathRewriter";

export default class RemoveBasePathRewriter implements PathRewriter {
  constructor(private readonly base: string) {}

  rewritePath(url: string): string {
    const result = url.substr(this.base.length) || "/index.html";
    if (!result.startsWith("/")) {
      return "/".concat(result);
    }
    return result;
  }

  willHandle(url: string): boolean {
    return url.startsWith(this.base);
  }
}
