import * as fs from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { RicApiError } from '../errors';
import type { Route, RouteInterface } from '../types';
import { Context } from './context';
import { findMatch } from './router';

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
export function handler(routes: Route[]) {
  return async (incomingMessage: IncomingMessage, serverResponse: ServerResponse) => {
    if (!incomingMessage.url) return serverResponse.end(); // TODO: handle

    const { method, url, headers } = incomingMessage;

    if (url === '/routes') {
      serverResponse.writeHead(200, { 'content-type': 'application/json' });
      serverResponse.write(JSON.stringify(routes));
      return serverResponse.end();
    }

    // generate a context
    const context = new Context(incomingMessage, serverResponse);

    const pathParts = url.split('/').filter(Boolean);
    const route: Route | undefined = findMatch(pathParts, routes, context);

    if (!route || !route.handler) {
      serverResponse.writeHead(404, { 'content-type': 'text/plain' });
      return serverResponse.end(); // TODO: handle
    }

    const contentType = headers['content-type'];

    const bodyParser = new BodyParser(context);
    await bodyParser.read(incomingMessage);

    if (contentType?.includes('json')) {
      context.setBody(bodyParser.toJson());
    }

    // run middlewares if there is any
    if (route.middlewares?.length) {
      for (const middleware of route.middlewares) {
        await middleware(context);
      }
    }

    const response = await route.handler(context);

    if (response instanceof RicApiError) {
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
  };
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
