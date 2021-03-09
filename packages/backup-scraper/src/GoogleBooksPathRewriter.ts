import PathRewriter from "./PathRewriter";
import qs from "querystring";

const BASE_URL = "http://books.google.com/books/content?";
const BASE_PATH = "/googlebooks/";

export default class GoogleBooksPathRewriter implements PathRewriter {
  rewritePath(url: string): string {
    const querystring = url.substr(BASE_URL.length);
    const parsed = qs.parse(querystring);
    return BASE_PATH.concat(`${parsed.id}.jpg`);
  }
  willHandle(url: string): boolean {
    return url.startsWith(BASE_URL);
  }
}
