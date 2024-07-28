import { IncomingMessage, ServerResponse } from "http";
import * as fs from 'fs/promises';
import * as path from 'path';
import { routes } from "..";
import { Context } from "./context";
import { Error } from "../errors";

// TODO: implement a better route matcher that would include custom params
export async function handler(incommingMessage: IncomingMessage, serverResponse: ServerResponse) {
  if (!incommingMessage.url) return serverResponse.end(); // TODO: handle

  const { method, url } = incommingMessage;
  const matcher = method + url;
  const _routeHandler = routes.get(matcher);

  // TODO: make it handle with the custom handler
  if (!_routeHandler) {
    const _404Handler = routes.get('__404__');
    
    if (_404Handler) {
      _404Handler(new Context(incommingMessage, serverResponse));
      return;      
    }

    const _404View = await fs.readFile(path.join(process.cwd(), 'src', 'views', '404.html'), 'utf8');

    serverResponse.writeHead(404, { 'content-type': 'text/html' });
    serverResponse.end(_404View);

    return;
  }

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
