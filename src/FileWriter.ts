export default interface FileWriter {
  writeFile(savePath: string, contents: Buffer | string): Promise<void>;
}
