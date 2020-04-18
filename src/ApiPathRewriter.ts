import PathRewriter from "./PathRewriter";

const BASE_URL = "https://api.mattb.tech/";
const BASE_PATH = "/api/";

export default class ApiPathRewriter implements PathRewriter {
  rewritePath(url: string): string {
    const withoutDomain = url.substr(BASE_URL.length);
    if (withoutDomain.startsWith("?query")) {
      throw new Error(`Api request missed persisted query cache: ${url}`);
    }
    return BASE_PATH.concat(withoutDomain);
  }
  willHandle(url: string): boolean {
    return url.startsWith(BASE_URL);
  }
}
