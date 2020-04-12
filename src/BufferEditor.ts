import PathRewriter from "./PathRewriter";
import isUtf8 from "isutf8";
import urlRegex from "url-regex";

export default class BufferEditor {
  constructor(private readonly pathRewriter: PathRewriter) {}

  async editBuffer(buffer: Buffer) {
    if (!isUtf8(buffer)) {
      return buffer;
    }
    let contentStr = buffer.toString();
    const urls = contentStr.match(urlRegex());
    urls?.forEach(url => {
      if (!this.pathRewriter.willHandle(url)) {
        console.warn(`No handler for ${url}`);
        return;
      }
      const newUrl = this.pathRewriter.rewritePath(url);
      if (newUrl !== null) {
        contentStr = contentStr.replace(new RegExp(url, 'g'), newUrl);
      }
    });
    return Buffer.from(contentStr);
  }
}
