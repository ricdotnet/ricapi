import { IncomingMessage, ServerResponse } from "http";
import * as fs from 'fs/promises';
import * as path from 'path';
import { Context } from "./context";
import { Error } from "../errors";
import { RouteInterface, RouteMap } from "../types";

// TODO: implement a better route matcher that would include custom params
export function handler(routes: RouteMap) {
  return async (incommingMessage: IncomingMessage, serverResponse: ServerResponse) => {
    if (!incommingMessage.url) return serverResponse.end(); // TODO: handle

    const { method, url } = incommingMessage;
    const matcher = method + url;
    const routeInterface = routes.get(matcher);
    
    // generate a context
    const context = new Context(incommingMessage, serverResponse);

    // TODO: make it handle with the custom handler
    if (!routeInterface) {
      return _404Handler(routes.get('__404__'), context);
    }
    
    if (routeInterface.middlewares) {
      for (const middleware of routeInterface.middlewares) {
        await middleware(context);
      }
    }

    const response = await routeInterface.handler(context);

    if (response instanceof Error) {
      context.__response.writeHead(response.statusCode, response.message, { 'Content-Type': 'application/json' });
      context.__response.end();
      return;
    }

    if (context.__response.writableFinished) {
      return;
    }

    context.__response.writeHead(200, { 'Content-Type': 'text/plain' });
    context.__response.write('returned in the handler');
    context.__response.end();
  }
}

async function _404Handler(routeInterface: RouteInterface | undefined, context: Context) {
  if (routeInterface) {
    routeInterface.handler(context);
    return;      
  }

  let filePath = path.join(process.cwd(), 'src', 'views', '404.html');
  if (process.env.NODE_ENV !== 'development') {
    filePath = path.join(process.cwd(), 'node_modules', '@ricdotnet/api', 'dist', 'src', 'views', '404.html');
  }

  const _404View = await fs.readFile(path.join(filePath), 'utf8');

  context.__response.writeHead(404, { 'content-type': 'text/html' });
  context.__response.end(_404View);

  return;
}
