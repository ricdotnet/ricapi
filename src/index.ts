import { createServer } from 'node:http';
import { HttpMethod } from './router/HttpMethod';
import type { Context } from './router/context';
import { handler } from './router/handler';
import { addRoute, routes } from './router/router';
import type { IRicApi, Route, RouteHandler, RouteHandlerFunction } from './types';

// when registering handlers, if we set an array with 1 that will be the route handler...
// if we set an array with 2, the first one will be a middleware and the second one will be the handler
// if we set an array with more than 2, the first ones will be middlewares and the last one will be the handler
function routeDefinitionHandler(
  method: HttpMethod,
): (path: string, handlers: RouteHandlerFunction | RouteHandlerFunction[]) => IRicApi;
function routeDefinitionHandler(method: HttpMethod) {
  return (path: string, handlers: RouteHandlerFunction | RouteHandlerFunction[]) => {
    const routeHandlerFunction = Array.isArray(handlers) ? handlers[handlers.length - 1] : handlers;

    if (!routeHandlerFunction) {
      throw new Error('No handler provided for the route.');
    }

    const route = addRoute(path, routeHandlerFunction, method) as unknown as Route;

    let middlewares: RouteHandlerFunction[] | undefined;

    if (Array.isArray(handlers)) {
      if (!handlers.length) {
        throw new Error('You passed an array of handlers but it is empty.');
      }

      middlewares = handlers.length ? handlers.slice(0, handlers.length - 1) : undefined;
    }

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
    routes.push({
      path: '__404__',
      children: [],
      handler: {
        [HttpMethod.GET]: cb,
      },
    });

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
