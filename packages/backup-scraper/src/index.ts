import { ScheduledEvent, Context } from "aws-lambda";
import chromium from "chrome-aws-lambda";
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
import S3FileWriter from "./S3FileWriter";
import { S3 } from "aws-sdk";

const WEBSITE = "https://mattb.tech/";
const VIEWPORT = { width: 4000, height: 2000 };

const PATH_REWRITER = new TrackingPathRewriter(
  new CombinedPathRewriter([
    new RemoveBasePathRewriter(WEBSITE),
    new FlickrPathRewriter(),
    new TypekitPathRewriter(),
    new GoodreadsPathRewriter(),
    new SpotifyPathRewriter(),
    new ApiPathRewriter()
  ])
);

const CONTENT_EDITOR = new ContentEditor(PATH_REWRITER);

const TRAVERSER = new Traverser(WEBSITE, WEBSITE);

const handler = async (event: ScheduledEvent, context: Context) => {
  const fileWriter = new S3FileWriter(
    new S3(),
    process.env.BACKUP_BUCKET,
    event.time
  );

  const responseHandler = new CombinedResponseHandler(PATH_REWRITER, [
    new SourcemapResponseHandler(fileWriter, PATH_REWRITER),
    new TextResponseHandler(fileWriter, CONTENT_EDITOR),
    new AnyResponseHandler(fileWriter)
  ]);

  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    });
    browser.on("disconnected", () => {
      console.log("Browser disconnected");
    });
    console.log("Browser launched");
    console.log("Browser launching new page");
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    page.on("requestfinished", async request =>
      responseHandler.handleResponse(request.response())
    );
    page.on("requestfailed", async request =>
      console.error(`Request failed: ${request.url()}`)
    );
    console.log("Browser launched new page");
    await TRAVERSER.go(async () => {
      return page;
    });
    // Wait 10 seconds at the end to ensure everything is finished before we close the browser
    await sleep(10000);
    console.log("Browser closing");
    await browser.close();
    console.log("Browser closed");
    context.succeed("Succeeded!");
  } catch (error) {
    console.error(error);
    context.fail(error);
  }
};

export { handler };
