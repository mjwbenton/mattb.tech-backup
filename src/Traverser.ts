import { Page, DirectNavigationOptions } from "puppeteer";
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
      const toVisit = [...this.toVisit];
      this.toVisit = [];
      await Promise.all(toVisit.map(url => this.handlePage(pageFactory, url)));
      console.log(
        `Currently ${this.toVisit.length} urls on queue: ${this.toVisit}.`
      );
    }
  }

  private async handlePage(
    pageFactory: () => Promise<Page>,
    url: string
  ): Promise<void> {
    console.log(`Visiting page ${url}`);
    const page = await pageFactory();
    await page.goto(url, GOTO_PARAMS);
    // Sleep to ensure that the page is ready to be evaluated
    await sleep(5000);
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
    // Sleep to ensure that the page's request handling has had time to finish
    await sleep(5000);
  }
}
