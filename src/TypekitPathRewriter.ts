import crypto from "crypto";
import PathRewriter from "./PathRewriter";

const PREFIX = "/typekit/";
const P_DOT = "https://p.typekit.net/";
const USE_DOT = "https://use.typekit.net/";

export default class TypekitPathRewriter implements PathRewriter {
  rewritePath(url: string): string {
    // Looks like P_DOT is just used for tracking, no need to rewrite it
    if (url.startsWith(P_DOT)) {
      return null;
    }
    // Some USE_DOT urls are just simple CSS file links, so just keep the path to those recognizable
    if (url.startsWith(USE_DOT) && url.endsWith(".css")) {
      return PREFIX.concat(url.substr(USE_DOT.length));
    }
    // Actual font links are long with lots of parameters, hash them
    return PREFIX.concat(
      crypto
        .createHash("md5")
        .update(url, "utf8")
        .digest("hex")
    );
  }
  willHandle(url: string): boolean {
    return url.startsWith(P_DOT) || url.startsWith(USE_DOT);
  }
}
