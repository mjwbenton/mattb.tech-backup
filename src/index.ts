import puppeteer from "puppeteer";
import CombinedPathRewriter from "./CombinedPathRewriter";
import RemoveBasePathRewriter from "./RemoveBasePathRewriter";
import FlickrPathRewriter from "./FlickrPathRewriter";
import { TrackingPathRewriter } from "./TrackingPathRewriter";
import ContentEditor from "./ContentEditor";
import TypekitPathRewriter from "./TypekitPathRewriter";
import ResponseHandler from "./ResponseHandler";

const WEBSITE = "https://mattb.tech/";
const VIEWPORT = { width: 4000, height: 2000 };

const pathRewriter = new TrackingPathRewriter(
  new CombinedPathRewriter([
    new RemoveBasePathRewriter(WEBSITE),
    new FlickrPathRewriter(),
    new TypekitPathRewriter()
  ])
);

const contentEditor = new ContentEditor(pathRewriter);

const responseHandler = new ResponseHandler(pathRewriter, contentEditor);

const main = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    page.on("requestfinished", async request =>
      responseHandler.handleResponse(request.response())
    );
    page.on("requestfailed", async request =>
      console.error(`Request failed: ${request.url()}`)
    );
    await page.goto(WEBSITE, { waitUntil: "networkidle0" });
    const urls = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map(
        (el: HTMLAnchorElement) => el.href
      )
    );
    for (const url of urls) {
      if (url.startsWith(WEBSITE)) {
        console.log(`Loading page ${url}`);
        await page.goto(url, { waitUntil: "networkidle0" });
      }
    }
    await browser.close();
  } catch (error) {
    console.error(error);
  }
};
main();
