import { createServer } from 'http';
import { Error } from './errors';
import { handler } from './router/handler';
import { Context } from './router/context';
import { HttpMethod } from './router/HttpMethod';

type RouteHandler = (context: Context<any>) => any;
type RouteDefinition = <T = any | Error>(path: string, handler: (context: Context<any>) => T) => IRicApi;

interface IRicApi {
  get: RouteDefinition;
  post: RouteDefinition;
  put: RouteDefinition;
  patch: RouteDefinition;
  delete: RouteDefinition;
  options: RouteDefinition;
  notFound: any; // TODO: handle this
  start: (port: number, cb?: (() => void)) => void;
}

const routes: Map<string, RouteHandler> = new Map();

const routeDefinitionHandler = (method: HttpMethod) => <T = any | Error>(path: string, handler: (context: Context<any>) => T) => {
  const matcher = method + path;

  if (routes.has(matcher)) {
    console.warn(`You have conflicting routes. The "${path}" route is already registered.`);
    return routeDefinitions;
  }

  console.log(`Registering ${matcher} route.`);
  routes.set(matcher, handler);

  return routeDefinitions;
}

const routeDefinitions: IRicApi = {
  get: routeDefinitionHandler(HttpMethod.GET),
  post: routeDefinitionHandler(HttpMethod.POST),
  put: routeDefinitionHandler(HttpMethod.PUT),
  patch: routeDefinitionHandler(HttpMethod.PATCH),
  delete: routeDefinitionHandler(HttpMethod.DELETE),
  options: routeDefinitionHandler(HttpMethod.OPTIONS),
  notFound: () => {
    // TODO: route not found handler
    // this will be good to set custom templates / responses for a 404
    // if not set we'll just return an empty 404
  },
  start: (port: number, cb) => {
    const server = createServer();

    server.on('request', handler);

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
  routes,
}

