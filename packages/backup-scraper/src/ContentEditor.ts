import PathRewriter from "./PathRewriter";
import urlRegex from "url-regex";
import escapeStringRegexp from "escape-string-regexp";
import {Logger} from 'winston';

export default class ContentEditor {
  private readonly logger: Logger;

  constructor(private readonly pathRewriter: PathRewriter, parentLogger: Logger) {
    this.logger = parentLogger.child({
      source: "ContentEditor"
    });
  }

  editContent(content: string): string {
    const urls = content.match(urlRegex());
    urls?.forEach(url => {
      if (!this.pathRewriter.willHandle(url)) {
        this.logger.debug("No handler for url on rewriting", { url });
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
