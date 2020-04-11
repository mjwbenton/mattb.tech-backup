import puppeteer from "puppeteer";
import * as fs from "fs";
import { promisify } from "util";
import path from "path";
import mkdirp from "mkdirp";

const writeFile = promisify(fs.writeFile);

const WEBSITE = "https://mattb.tech/";
const OUTPUT_PATH = path.normalize(path.join(__dirname, "..", "output"));

const main = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on("response", async response => {
      console.log(response.url());
      if (response.url().startsWith(WEBSITE)) {
        const savePath = path.join(
          OUTPUT_PATH,
          response.url().substr(WEBSITE.length) || "index.html"
        );
        await mkdirp(path.parse(savePath).dir);
        await writeFile(savePath, await response.buffer());
      }
    });
    await page.goto(WEBSITE, { waitUntil: "networkidle0" });
    await browser.close();
  } catch (error) {
    console.error(error);
  }
};
main();
