export default interface FileWriter {
  writeFile(
    savePath: string,
    contentType: string,
    contents: Buffer | string
  ): Promise<void>;
}
