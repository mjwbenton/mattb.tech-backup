import { Page, DirectNavigationOptions } from "puppeteer-core";
import sleep from "./sleep";

const GOTO_PARAMS: DirectNavigationOptions = {
  waitUntil: "networkidle0",
  timeout: 0
};

export default class Traverser {
  private readonly queued: Set<string>;
  private toVisit: string[];

  constructor(startUrl: string, private readonly whitelistDomain: string) {
    this.queued = new Set<string>([startUrl]);
    this.toVisit = [startUrl];
  }

  async go(pageFactory: () => Promise<Page>) {
    while (this.toVisit.length !== 0) {
      await this.handlePage(pageFactory, this.toVisit.shift());
      console.log(
        `Currently ${this.toVisit.length} urls on queue: ${this.toVisit}.`
      );
    }
    return Promise.resolve();
  }

  private async handlePage(
    pageFactory: () => Promise<Page>,
    url: string
  ): Promise<void> {
    console.log(`Visiting page ${url}`);
    const page = await pageFactory();
    await page.goto(url, GOTO_PARAMS);
    // Sleep to ensure that the page is ready to be evaluated and additional requests have had time to finish
    await sleep(10000);
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
  }
}
