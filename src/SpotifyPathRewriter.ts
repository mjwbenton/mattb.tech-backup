import PathRewriter from "./PathRewriter";

const BASE_URL = "https://i.scdn.co/image/";
const BASE_PATH = "/spotify/";

export default class SpotifyPathRewriter implements PathRewriter {
  rewritePath(url: string): string {
    return BASE_PATH.concat(url.substr(BASE_URL.length));
  }
  willHandle(url: string): boolean {
    return url.startsWith(BASE_URL);
  }
}
