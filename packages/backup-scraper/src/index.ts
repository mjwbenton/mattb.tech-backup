import { ScheduledEvent, Context } from "aws-lambda";
import chromium from "chrome-aws-lambda";
import CombinedPathRewriter from "./CombinedPathRewriter";
import RemoveBasePathRewriter from "./RemoveBasePathRewriter";
import FlickrPathRewriter from "./FlickrPathRewriter";
import { TrackingPathRewriter } from "./TrackingPathRewriter";
import ContentEditor from "./ContentEditor";
import CombinedResponseHandler from "./CombinedResponseHandler";
import SpotifyPathRewriter from "./SpotifyPathRewriter";
import Traverser from "./Traverser";
import SourcemapResponseHandler from "./SourcemapResponseHandler";
import TextResponseHandler from "./TextResponseHandler";
import AnyResponseHandler from "./AnyResponseHandler";
import ApiPathRewriter from "./ApiPathRewriter";
import S3FileWriter from "./S3FileWriter";
import { S3 } from "aws-sdk";
import winston from "winston";
import { MESSAGE } from "triple-beam";
import GoogleBooksPathRewriter from "./GoogleBooksPathRewriter";
import Downloader from "./Downloader";

const WEBSITE = `https://${process.env.WEBSITE}/`;
const VIEWPORT = { width: 4000, height: 2000 };

const LOGGER = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf((info) => {
      return `${info.timestamp} ${info.requestId} ${info.level.toUpperCase()} ${
        info[MESSAGE]
      }`;
    })
  ),
  defaultMeta: { service: "mattb.tech-backup-scraper" },
  transports: [new winston.transports.Console({ level: "debug" })],
});

const handler = async (event: ScheduledEvent, context: Context) => {
  const logger = LOGGER.child({
    requestId: context.awsRequestId,
    functionVersion: context.functionVersion,
    eventTime: event.time,
  });

  const prefix = event.time;

  const pathRewriter = new TrackingPathRewriter(
    new CombinedPathRewriter([
      new RemoveBasePathRewriter(WEBSITE),
      new FlickrPathRewriter(),
      new SpotifyPathRewriter(),
      new ApiPathRewriter(),
      new GoogleBooksPathRewriter(),
    ]),
    logger
  );

  const contentEditor = new ContentEditor(pathRewriter, logger);

  const fileWriter = new S3FileWriter(
    new S3(),
    process.env.BACKUP_BUCKET,
    prefix
  );

  const downloader = new Downloader(fileWriter, pathRewriter, logger);

  const traverser = new Traverser(WEBSITE, WEBSITE, downloader, logger);

  const responseHandler = new CombinedResponseHandler(
    pathRewriter,
    [
      new SourcemapResponseHandler(fileWriter, pathRewriter, logger),
      new TextResponseHandler(fileWriter, contentEditor, logger),
      new AnyResponseHandler(fileWriter, logger),
    ],
    logger
  );

  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    browser.on("disconnected", () => {
      logger.debug("Browser Disconnected");
    });
    logger.debug("Browser Launched");
    const page = await browser.newPage();
    logger.debug("Browser New Page");
    await page.setViewport(VIEWPORT);
    page.on("requestfinished", async (request) =>
      responseHandler.handleResponse(request.response())
    );
    page.on("requestfailed", async (request) =>
      logger.error("Request failed", { url: request.url() })
    );
    await traverser.go(page);
    logger.debug("Closing");
    await browser.close();
    logger.debug("Closed");
    context.succeed({ prefix });
  } catch (error) {
    logger.error({ error });
    context.fail(error);
  }
};

export { handler };
