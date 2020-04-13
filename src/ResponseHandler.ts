import { Response } from "puppeteer";

export interface ResponseHandlerResult {
  readonly handled: boolean;
}

export default interface ResponseHandler {
  handleResponse(
    response: Response,
    writePath: string
  ): Promise<ResponseHandlerResult>;
}

export function getContentType(response: Response) {
  return response.headers()["content-type"];
}
