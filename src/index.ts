import { createServer } from 'node:http';
import { HttpMethod } from './router/HttpMethod';
import type { Context } from './router/context';
import { handler } from './router/handler';
import { addRoute, routes } from './router/router';
import type { IRicApi, Route, RouteHandler } from './types';

// when registering handlers, if we set an array with 1 that will be the route handler...
// if we set an array with 2, the first one will be a middleware and the second one will be the handler
// if we set an array with more than 2, the first ones will be middlewares and the last one will be the handler
function routeDefinitionHandler(method: HttpMethod): (path: string, handlers: RouteHandler | RouteHandler[]) => IRicApi;
function routeDefinitionHandler(method: HttpMethod) {
  return (path: string, handlers: RouteHandler | RouteHandler[]) => {
    const route = addRoute(path, method) as unknown as Route;

    let middlewares: RouteHandler[] | undefined;
    let handler: RouteHandler | undefined;

    if (Array.isArray(handlers)) {
      if (!handlers.length) {
        throw new Error('You passed an array of handlers but it is empty.');
      }

      handler = handlers.pop();
      middlewares = handlers.length ? handlers : undefined;
    } else {
      handler = handlers;
    }

    if (!handler) {
      throw new Error('No handler provided for the route.');
    }

    // we have GET by default
    if (method !== HttpMethod.GET) {
      route.method = method;
    }

    console.log(`Registering ${method}${path} route.`);
    route.handler = handler;
    route.middlewares = middlewares;

    return routeDefinitions;
  };
}

const routeDefinitions: IRicApi = {
  globalMiddlewares: (middlewares: RouteHandler[]) => {
    // TODO: register global middlewares

    return routeDefinitions;
  },
  get: routeDefinitionHandler(HttpMethod.GET),
  post: routeDefinitionHandler(HttpMethod.POST),
  put: routeDefinitionHandler(HttpMethod.PUT),
  patch: routeDefinitionHandler(HttpMethod.PATCH),
  delete: routeDefinitionHandler(HttpMethod.DELETE),
  options: routeDefinitionHandler(HttpMethod.OPTIONS),
  notFound: (cb: (context: Context) => void) => {
    // routes.set('__404__', { handler: cb });

    return routeDefinitions;
  },
  start: (port: number, cb) => {
    const server = createServer();

    server.on('request', handler(routes));

    server.listen(
      port,
      cb ??
        (() => {
          console.log(`RicApi listening on http://localhost:${port}`);
        }),
    );
  },
};

function RicApi(): IRicApi {
  return routeDefinitions;
}

export { RicApi, type Context };
