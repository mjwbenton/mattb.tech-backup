import { Page, DirectNavigationOptions } from "puppeteer";

const GOTO_PARAMS: DirectNavigationOptions = {
  waitUntil: "networkidle0",
  timeout: 0
};

export default class Traverser {
  private readonly queued: Set<string>;
  private readonly toVisit: string[];

  constructor(startUrl: string, private readonly whitelistDomain: string) {
    this.queued = new Set<string>([startUrl]);
    this.toVisit = [startUrl];
  }

  async go(page: Page) {
    while (this.toVisit.length !== 0) {
      const url = this.toVisit.shift();
      console.log(`Visiting page ${url}`);
      await page.goto(url, GOTO_PARAMS);
      const nextUrls = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]")).map(
          (el: HTMLAnchorElement) => el.href
        )
      );
      nextUrls
        .filter(nextUrl => nextUrl.startsWith(this.whitelistDomain))
        .forEach(nextUrl => {
          if (!this.queued.has(nextUrl)) {
            this.queued.add(nextUrl);
            this.toVisit.push(nextUrl);
          }
        });
      console.log(
        `Currently ${this.toVisit.length} urls on queue: ${this.toVisit}.`
      );
    }
  }
}
