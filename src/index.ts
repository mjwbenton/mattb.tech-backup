import puppeteer from "puppeteer";
import * as fs from "fs";
import { promisify } from "util";
import path from "path";
import mkdirp from "mkdirp";
import CombinedPathRewriter from "./CombinedPathRewriter";
import RemoveBasePathRewriter from "./RemoveBasePathRewriter";
import FlickrPathRewriter from "./FlickrPathRewriter";
import { TrackingPathRewriter } from "./TrackingPathRewriter";
import BufferEditor from "./BufferEditor";
import TypekitPathRewriter from "./TypekitPathRewriter";

const writeFile = promisify(fs.writeFile);

const WEBSITE = "https://mattb.tech/";
const OUTPUT_PATH = path.normalize(path.join(__dirname, "..", "output"));
const VIEWPORT = { width: 4000, height: 2000 };

const pathRewriter = new TrackingPathRewriter(
  new CombinedPathRewriter([
    new RemoveBasePathRewriter(WEBSITE),
    new FlickrPathRewriter(),
    new TypekitPathRewriter()
  ])
);

const bufferEditor = new BufferEditor(pathRewriter);

const main = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    page.on("response", async response => {
      const rewriterPath = pathRewriter.rewritePath(response.url());
      if (!rewriterPath) {
        return;
      }
      const savePath = path.join(OUTPUT_PATH, rewriterPath);
      await mkdirp(path.parse(savePath).dir);
      const outputBuffer = await bufferEditor.editBuffer(
        await response.buffer()
      );
      await writeFile(savePath, outputBuffer);
    });
    await page.goto(WEBSITE, { waitUntil: "networkidle0" });
    await browser.close();
  } catch (error) {
    console.error(error);
  }
};
main();
