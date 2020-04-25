import { Page, DirectNavigationOptions } from "puppeteer-core";
import sleep from "./sleep";
import { Logger } from "winston";

const GOTO_PARAMS: DirectNavigationOptions = {
  waitUntil: "networkidle0",
  timeout: 0
};

export default class Traverser {
  private readonly queued: Set<string>;
  private toVisit: string[];
  private readonly logger: Logger;

  constructor(
    startUrl: string,
    private readonly whitelistDomain: string,
    parentLogger: Logger
  ) {
    this.queued = new Set<string>([startUrl]);
    this.toVisit = [startUrl];
    this.logger = parentLogger.child({
      source: "Traverser"
    });
  }

  async go(pageFactory: () => Promise<Page>) {
    while (this.toVisit.length !== 0) {
      await this.handlePage(pageFactory, this.toVisit.shift());
      this.logger.debug("Remaining urls", { remainingUrls: this.toVisit });
    }
    return Promise.resolve();
  }

  private async handlePage(
    pageFactory: () => Promise<Page>,
    url: string
  ): Promise<void> {
    this.logger.debug("Visiting page", { url });
    const page = await pageFactory();
    await page.goto(url, GOTO_PARAMS);
    this.logger.debug("Sleeping 10000", { url });
    await sleep(10000);
    const nextUrls = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map(
        (el: HTMLAnchorElement) => el.href
      )
    );
    this.logger.debug("Found new urls", { url, nextUrls });
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
