import * as fs from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { RicApiError } from '../errors';
import type { Route } from '../types';
import { HttpMethod } from './HttpMethod';
import { Context } from './context';
import { findMatch } from './router';

class BodyParser {
  private readonly context: Context;
  private readonly chunks: Buffer[];

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
    const jsonedBody = JSON.parse(this.chunks.join('').toString());
    this.context.body = jsonedBody;
  }
}

export function handler(routes: Route[]) {
  return async (incomingMessage: IncomingMessage, serverResponse: ServerResponse) => {
    if (!incomingMessage.url) return serverResponse.end();

    const { method, url, headers } = incomingMessage;
    const _method: HttpMethod = <HttpMethod>method ?? HttpMethod.GET;

    if (url === '/routes') {
      console.log(routes);
      serverResponse.writeHead(200, { 'content-type': 'application/json' });
      serverResponse.write(JSON.stringify(routes));
      return serverResponse.end();
    }

    // generate a context
    const context = new Context(incomingMessage, serverResponse);

    const pathParts = url.split('/').filter(Boolean);
    const route: Route | undefined = findMatch(pathParts, routes, context);

    if (!route?.handler[_method]) {
      return _404Handler(routes, context);
    }

    const contentType = headers['content-type'];

    const bodyParser = new BodyParser(context);
    await bodyParser.read(incomingMessage);

    if (contentType?.includes('json')) {
      bodyParser.toJson();
    }

    // run middlewares if there is any
    if (route.middlewares?.length) {
      for (const middleware of route.middlewares) {
        await middleware(context);
      }
    }

    console.log(`Handling ${_method} ${url}`);
    const handlerFunction = route.handler[_method];

    try {
      await handlerFunction(context);
    } catch (error) {
      if (error instanceof RicApiError) {
        context.__response.writeHead(error.statusCode, error.message, { 'Content-Type': 'application/json' });
        context.__response.end();
        return;
      }

      context.__response.writeHead(500, 'Internal Server Error', { 'Content-Type': 'application/json' });
      context.__response.end();
    }

    if (context.__response.writableFinished) {
      return;
    }

    context.responseHeaders.forEach((value, key) => {
      context.__response.setHeader(key, value);
    });

    context.__response.statusCode = context.statusCode ?? 200;

    if (context.responseData) {
      let buffer: Buffer = Buffer.from([]);      

      if (typeof context.responseData === 'string' || typeof context.responseData === 'number' || typeof context.responseData === 'boolean') {
        console.log('is string number or boolean:', context.responseData);
        context.__response.setHeader('content-type', 'text/plain');
        buffer = Buffer.from(String(context.responseData));
      }

      if (typeof context.responseData === 'object') {
        context.__response.setHeader('content-type', 'application/json');
        buffer = Buffer.from(JSON.stringify(context.responseData));
      }

      context.__response.setHeader('content-length', buffer.length);
      context.__response.write(buffer);
    }

    context.__response.end();
  };
}

async function _404Handler(routes: Route[], context: Context) {
  const route: Route | undefined = routes.find((r) => r.path === '__404__');

  if (route?.handler[HttpMethod.GET]) {
    const handlerFunction = route.handler[HttpMethod.GET];
    await handlerFunction(context);
    return;
  }

  let filePath = path.join(process.cwd(), 'src', 'views', '404.html');
  if (process.env.NODE_ENV !== 'development') {
    filePath = path.join(process.cwd(), 'node_modules', '@ricdotnet/api', 'dist', 'src', 'views', '404.html');
  }

  const _404View = await fs.readFile(path.join(filePath), 'utf8');

  context.__response.writeHead(404, { 'content-type': 'text/html' });
  context.__response.end(_404View);
}
