export default interface PathRewriter {
  rewritePath(url: string): string | null;
  willHandle(url: string): boolean;
}
