import path from "path";
import * as fs from "fs";
import { promisify } from "util";
import mkdirp from "mkdirp";
import FileWriter from "./FileWriter";

const writeFile = promisify(fs.writeFile);

const localFileWriter: FileWriter = {
  async writeFile(savePath: string, contents: Buffer | string): Promise<void> {
    await mkdirp(path.parse(savePath).dir);
    await writeFile(savePath, contents);
  }
};
export default localFileWriter;
