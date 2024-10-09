import { createServer } from 'node:http';
import { HttpMethod } from './router/HttpMethod';
import type { Context } from './router/context';
import { handler } from './router/handler';
import { addRoute, globalMiddlewares, routes } from './router/router';
import type { IRicApi, Route, RouteHandler, RouteHandlerFunction } from './types';

type RouteDefinition = {
  path: string;
  definition: {
    method: HttpMethod;
    handlers: RouteHandlerFunction | RouteHandlerFunction[];
  };
};

const routesContainer: RouteDefinition[] = [];

function registerRoutes() {
  for (const route of routesContainer) {
    const { path, definition } = route;
    const { method, handlers } = definition;

    const routeHandlerFunction = Array.isArray(handlers) ? handlers[handlers.length - 1] : handlers;

    if (!routeHandlerFunction) {
      throw new Error('No handler provided for the route.');
    }

    console.log(`Registering ${method}${path} route.`);

    const addedRoute = addRoute(path, routeHandlerFunction, method) as unknown as Route;
    let middlewares: RouteHandlerFunction[] | undefined;

    if (Array.isArray(handlers)) {
      if (!handlers.length) {
        throw new Error('You passed an array of handlers but it is empty.');
      }
      middlewares = handlers.length ? handlers.slice(0, handlers.length - 1) : undefined;
    }

    addedRoute.middlewares = middlewares;
  }
}

// when registering handlers, if we set an array with 1 that will be the route handler...
// if we set an array with 2, the first one will be a middleware and the second one will be the handler
// if we set an array with more than 2, the first ones will be middlewares and the last one will be the handler
function routeDefinitionHandler(
  method: HttpMethod,
): (path: string, handlers: RouteHandlerFunction | RouteHandlerFunction[]) => IRicApi;
function routeDefinitionHandler(method: HttpMethod) {
  return (path: string, handlers: RouteHandlerFunction | RouteHandlerFunction[]) => {
    routesContainer.push({
      path,
      definition: {
        method,
        handlers,
      },
    });

    return routeDefinitions;
  };
}

const routeDefinitions: IRicApi = {
  globalMiddlewares: (middlewares: RouteHandlerFunction[]) => {
    for (const middleware of middlewares) {
      globalMiddlewares.push(middleware);
    }

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
    if (!port) {
      throw new Error('You must provide a port number to start the server.');
    }

    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development';
    }

    // register config
    // global middlewares will register as soon as the globalMiddlewares function is called
    registerRoutes();

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
