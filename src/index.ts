import puppeteer from "puppeteer";
//import path from "path";
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
import sleep from "./sleep";
//import LocalFileWriter from "./LocalFileWriter";
import S3FileWriter from "./S3FileWriter";
import { S3 } from "aws-sdk";

const WEBSITE = "https://mattb.tech/";
const VIEWPORT = { width: 4000, height: 2000 };
//const OUTPUT_PATH = path.normalize(path.join(__dirname, "..", "output"));

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

//const fileWriter = new LocalFileWriter(OUTPUT_PATH);
const fileWriter = new S3FileWriter(
  new S3(),
  "mattbtechbackup-backupbucket26b8e51c-s3mkg5h2yjo2",
  "current"
);

const responseHandler = new CombinedResponseHandler(pathRewriter, [
  new SourcemapResponseHandler(fileWriter, pathRewriter),
  new TextResponseHandler(fileWriter, contentEditor),
  new AnyResponseHandler(fileWriter)
]);

const traverser = new Traverser(WEBSITE, WEBSITE);

const main = async () => {
  try {
    const browser = await puppeteer.launch();
    await traverser.go(async () => {
      const page = await browser.newPage();
      await page.setViewport(VIEWPORT);
      page.on("requestfinished", async request =>
        responseHandler.handleResponse(request.response())
      );
      page.on("requestfailed", async request =>
        console.error(`Request failed: ${request.url()}`)
      );
      return page;
    });
    // Wait 10 seconds at the end to ensure everything is finished before we close the browser
    await sleep(10000);
    await browser.close();
  } catch (error) {
    console.error(error);
  }
};
main();
