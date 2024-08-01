import { IncomingMessage, ServerResponse } from "http";
import * as fs from 'fs/promises';
import * as path from 'path';
import { Context } from "./context";
import { Error } from "../errors";
import { RouteInterface, RouteMap } from "../types";

class BodyParser {
  private context: Context;
  private chunks: Buffer[];

  constructor(context: Context) {
    this.context = context;
    this.chunks = [];
  }

  async read(incomingMessage: IncomingMessage) {
    return new Promise((resolve, reject) => {
      incomingMessage.on('data', (chunk) => {
        this.chunks.push(chunk);
      });

      incomingMessage.on('end', resolve);
      incomingMessage.on('error', reject);
    });
  }

  toJson() {
    return JSON.parse(this.chunks.join('').toString());
  }
}

// TODO: implement a better route matcher that would include custom params
export function handler(routes: RouteMap) {
  return async (incomingMessage: IncomingMessage, serverResponse: ServerResponse) => {
    if (!incomingMessage.url) return serverResponse.end(); // TODO: handle

    const { method, url, headers } = incomingMessage;
    const matcher = method + url;
    const routeInterface = routes.get(matcher);

    const contentType = headers['content-type'];

    // generate a context
    const context = new Context(incomingMessage, serverResponse);

    const bodyParser = new BodyParser(context);
    await bodyParser.read(incomingMessage);

    if (contentType && contentType.includes('json')) {
      context.setBody(bodyParser.toJson());
    }

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
