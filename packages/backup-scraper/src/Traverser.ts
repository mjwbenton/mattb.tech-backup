import { Page, DirectNavigationOptions } from "puppeteer-core";
import sleep from "./sleep";
import { Logger } from "winston";
import Downloader from "./Downloader";

const GOTO_PARAMS: DirectNavigationOptions = {
  waitUntil: "networkidle0",
  timeout: 0,
};

export default class Traverser {
  private readonly queued: Set<string>;
  private toVisit: string[];
  private readonly logger: Logger;

  constructor(
    startUrl: string,
    private readonly whitelistDomain: string,
    private readonly downloader: Downloader,
    parentLogger: Logger
  ) {
    this.queued = new Set<string>([startUrl]);
    this.toVisit = [startUrl];
    this.logger = parentLogger.child({
      source: "Traverser",
    });
  }

  async go(page: Page) {
    while (this.toVisit.length !== 0) {
      await this.handlePage(page, this.toVisit.shift());
      this.logger.debug("Remaining urls", { remainingUrls: this.toVisit });
    }
    return Promise.resolve();
  }

  private async handlePage(page: Page, url: string): Promise<void> {
    if (this.downloader.willHandle(url)) {
      await this.downloader.handleUrl(url);
      this.logger.debug("Downloader will handle url without traversal", {
        url,
      });
      return;
    }
    this.logger.debug("Visiting page", { url });
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
      .filter((nextUrl) => nextUrl.startsWith(this.whitelistDomain))
      .forEach((nextUrl) => {
        if (!this.queued.has(nextUrl)) {
          this.queued.add(nextUrl);
          this.toVisit.push(nextUrl);
        }
      });
  }
}
