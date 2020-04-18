import puppeteer from "puppeteer";
import path from "path";
import CombinedPathRewriter from "./CombinedPathRewriter";
import RemoveBasePathRewriter from "./RemoveBasePathRewriter";
import FlickrPathRewriter from "./FlickrPathRewriter";
import { TrackingPathRewriter } from "./TrackingPathRewriter";
import ContentEditor from "./ContentEditor";
import TypekitPathRewriter from "./TypekitPathRewriter";
import CombinedResponseHandler from "./CombinedResponseHandler";
import GoodreadsPathRewriter from "./GoodreadsPathRewriter";
import SpotifyPathRewriter from "./SpotifyPathRewriter";
import Traverser from "./Traverser";
import SourcemapResponseHandler from "./SourcemapResponseHandler";
import TextResponseHandler from "./TextResponseHandler";
import AnyResponseHandler from "./AnyResponseHandler";
import ApiPathRewriter from "./ApiPathRewriter";

const WEBSITE = "https://mattb.tech/";
const VIEWPORT = { width: 4000, height: 2000 };
const OUTPUT_PATH = path.normalize(path.join(__dirname, "..", "output"));

const pathRewriter = new TrackingPathRewriter(
  new CombinedPathRewriter([
    new RemoveBasePathRewriter(WEBSITE),
    new FlickrPathRewriter(),
    new TypekitPathRewriter(),
    new GoodreadsPathRewriter(),
    new SpotifyPathRewriter(),
    new ApiPathRewriter()
  ])
);

const contentEditor = new ContentEditor(pathRewriter);

const responseHandler = new CombinedResponseHandler(pathRewriter, OUTPUT_PATH, [
  new SourcemapResponseHandler(pathRewriter, OUTPUT_PATH),
  new TextResponseHandler(contentEditor),
  new AnyResponseHandler()
]);

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
