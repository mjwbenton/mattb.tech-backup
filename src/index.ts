import puppeteer from "puppeteer";
import CombinedPathRewriter from "./CombinedPathRewriter";
import RemoveBasePathRewriter from "./RemoveBasePathRewriter";
import FlickrPathRewriter from "./FlickrPathRewriter";
import { TrackingPathRewriter } from "./TrackingPathRewriter";
import ContentEditor from "./ContentEditor";
import TypekitPathRewriter from "./TypekitPathRewriter";
import ResponseHandler from "./ResponseHandler";
import GoodreadsPathRewriter from "./GoodreadsPathRewriter";
import SpotifyPathRewriter from "./SpotifyPathRewriter";
import Traverser from "./Traverser";

const WEBSITE = "https://mattb.tech/";
const VIEWPORT = { width: 4000, height: 2000 };

const pathRewriter = new TrackingPathRewriter(
  new CombinedPathRewriter([
    new RemoveBasePathRewriter(WEBSITE),
    new FlickrPathRewriter(),
    new TypekitPathRewriter(),
    new GoodreadsPathRewriter(),
    new SpotifyPathRewriter()
  ])
);

const contentEditor = new ContentEditor(pathRewriter);

const responseHandler = new ResponseHandler(pathRewriter, contentEditor);

const traverser = new Traverser(WEBSITE, WEBSITE);

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
    await traverser.go(page);
    await browser.close();
  } catch (error) {
    console.error(error);
  }
};
main();
