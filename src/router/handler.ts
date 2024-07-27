import { IncomingMessage, ServerResponse } from "http";
import { routes } from "..";
import { Context } from "./context";
import { Error } from "../errors";

// TODO: implement a better route matcher that would include custom params
export async function handler(incommingMessage: IncomingMessage, serverResponse: ServerResponse) {
  if (!incommingMessage.url) return serverResponse.end(); // TODO: handle

  const { method, url } = incommingMessage;
  const matcher = method + url;
  const _routeHandler = routes.get(matcher);

  if (!_routeHandler) return serverResponse.end(); // TODO: handle a 404

  const response = await _routeHandler(new Context(incommingMessage, serverResponse));

  if (response instanceof Error) {
    serverResponse.writeHead(response.statusCode, response.message, { 'Content-Type': 'application/json' });
    serverResponse.end();
    return;
  }

  if (serverResponse.writableFinished) {
    return;
  }

  serverResponse.writeHead(200, { 'Content-Type': 'text/plain' });
  serverResponse.write('returned in the handler');
  serverResponse.end();
}
