import PathRewriter from "./PathRewriter";
const OUTPUT_BASE = "/goodreads/";
const BASE_URL =
  "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/";

const NO_PHOTO_BASE = "https://s.gr-assets.com/assets/nophoto/";

export default class GoodreadsPathRewriter implements PathRewriter {
  rewritePath(url: string): string {
    if (url.startsWith(BASE_URL)) {
      return OUTPUT_BASE.concat(url.substr(BASE_URL.length).replace("/", "_"));
    }
    if (url.startsWith(NO_PHOTO_BASE)) {
      return OUTPUT_BASE.concat(
        url.substr(NO_PHOTO_BASE.length).replace("/", "_")
      );
    }
  }
  willHandle(url: string): boolean {
    return url.startsWith(BASE_URL) || url.startsWith(NO_PHOTO_BASE);
  }
}
