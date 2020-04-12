import PathRewriter from "./PathRewriter";
import urlRegex from "url-regex";
import escapeStringRegexp from "escape-string-regexp";

export default class ContentEditor {
  constructor(private readonly pathRewriter: PathRewriter) {}

  editContent(content: string): string {
    const urls = content.match(urlRegex());
    urls?.forEach(url => {
      if (!this.pathRewriter.willHandle(url)) {
        console.warn(`No handler for ${url}`);
        return;
      }
      const newUrl = this.pathRewriter.rewritePath(url);
      if (newUrl !== null) {
        content = content.replace(new RegExp(escapeStringRegexp(url), 'g'), newUrl);
      }
    });
    return content;
  }
}
