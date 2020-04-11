import PathRewriter from "./PathRewriter";

const FLICKR_BASE_URL = "https://live.staticflickr.com/";
const OUTPUT_BASE = "flickr/";

export default class FlickrPathRewriter implements PathRewriter {
  rewritePath(url: string): string {
    return OUTPUT_BASE.concat(
      url.substr(FLICKR_BASE_URL.length).replace("/", "_")
    );
  }
  willHandle(url: string): boolean {
    return url.startsWith(FLICKR_BASE_URL);
  }
}
