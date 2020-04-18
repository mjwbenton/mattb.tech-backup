import path from "path";
import * as fs from "fs";
import { promisify } from "util";
import mkdirp from "mkdirp";
import FileWriter from "./FileWriter";

const writeFile = promisify(fs.writeFile);

export default class LocalFileWriter implements FileWriter {
  constructor(private readonly outputPath: string) {}
  async writeFile(savePath: string, contents: string | Buffer): Promise<void> {
    const fullPath = path.join(this.outputPath, savePath);
    await mkdirp(path.parse(fullPath).dir);
    await writeFile(fullPath, contents);
  }
}
