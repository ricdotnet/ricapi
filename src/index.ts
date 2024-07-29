import { createServer } from 'http';
import { handler } from './router/handler';
import type { Context } from './router/context';
import { HttpMethod } from './router/HttpMethod';
import type { RouteHandler, IRicApi, RouteMap, RouteInterface } from './types';

const routes: RouteMap = new Map();

function routeDefinitionHandler(method: HttpMethod): (path: string, handlers: RouteHandler | RouteHandler[]) => IRicApi;
function routeDefinitionHandler(method: HttpMethod) {
  return (path: string, handlers: RouteHandler | RouteHandler[]) => {
    const matcher = method + path;

    if (routes.has(matcher)) {
      console.warn(`You have conflicting routes. The "${path}" route is already registered.`);
      return routeDefinitions;
    }
    
    let middlewares: RouteHandler[] | undefined;
    let handler: RouteHandler | undefined;
    
    if (handlers instanceof Array) {
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
    
    const routeInterface: RouteInterface = {
      middlewares,
      handler,
    }

    console.log(`Registering ${matcher} route.`);
    routes.set(matcher, routeInterface);

    return routeDefinitions;
  }
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
    routes.set('__404__', { handler: cb });

    return routeDefinitions;
  },
  start: (port: number, cb) => {
    const server = createServer();

    server.on('request', handler(routes));

    server.listen(port, cb ?? (() => {
      console.log(`RicApi listening on http://localhost:${port}`)
    }));
  },
};

function RicApi(): IRicApi {
  return routeDefinitions;
}

export {
  RicApi,
  Context,
}
