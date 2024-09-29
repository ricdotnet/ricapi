import { IncomingMessage, ServerResponse } from "http";
import * as fs from 'fs/promises';
import * as path from 'path';
import { Context } from "./context";
import { Error } from "../errors";
import { RouteInterface, Route } from "../types";

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

function findMatch(pathParts: string[], routes: Route[], context: Context): Route | void {
  let match = null;

  for (let part of pathParts) {
    match = routes.find(r => {
      if (r.path.startsWith(':')) {
        const hasExact = routes.find(r => r.path === part);
        if (hasExact) {
          return true;
        }
        
        context.setParam(r.path.slice(1), part);
        return true;
      }
      return r.path === part;
    });
    if (match) {
      break;
    }
  }
  
  if (!match) {
    return;
  }

  if (pathParts.length === 1) {
    return match;
  }

  pathParts.shift(); // pop the current parent
  return findMatch(pathParts, match.children, context);
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
    const route: Route | void = findMatch(pathParts, routes, context);
    
    if (!route || !route.handler) {
      serverResponse.writeHead(404, { 'content-type': 'text/plain' });
      return serverResponse.end(); // TODO: handle
    }

    const contentType = headers['content-type'];

    const bodyParser = new BodyParser(context);
    await bodyParser.read(incomingMessage);

    if (contentType && contentType.includes('json')) {
      context.setBody(bodyParser.toJson());
    }

    // run middlewares if there is any
    if (route.middlewares && route.middlewares.length) {
      for (const middleware of route.middlewares) {
        await middleware(context);
      }
    }

    const response = await route.handler(context);

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
