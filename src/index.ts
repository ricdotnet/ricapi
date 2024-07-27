import { createServer, IncomingMessage, ServerResponse } from 'http';

type RouteDefinition = <T = any | Error>(path: string, handler: (context: any) => T) => IRicApi;
// TODO: will make this better later
type RequestContext = {
  request: IncomingMessage,
  response: ServerResponse,
};

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

enum RouteMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
}

const routes: Map<string, (context: any) => any> = new Map();

const routeDefinitionHandler = (method: RouteMethods) => <T = any>(path: string, handler: (context: RequestContext) => T) => {
  if (routes.has(path)) {
    console.warn(`You have conflicting routes. The "${path}" route is already registered.`);
    return routeDefinitions;
  }

  console.log(`Registering ${method}:${path} route.`);
  routes.set(method + path, handler);

  return routeDefinitions;
}

const routeDefinitions: IRicApi = {
  get: routeDefinitionHandler(RouteMethods.GET),
  post: routeDefinitionHandler(RouteMethods.POST),
  put: routeDefinitionHandler(RouteMethods.PUT),
  patch: routeDefinitionHandler(RouteMethods.PATCH),
  delete: routeDefinitionHandler(RouteMethods.DELETE),
  options: routeDefinitionHandler(RouteMethods.OPTIONS),
  notFound: () => {
    // TODO: route not found handler
    // this will be good to set custom templates / responses for a 404
    // if not set we'll just return an empty 404
  },
  start: (port: number, cb) => {
    const server = createServer();

    server.on('request', async (req, res) => {
      if (!req.url) return res.end(); // TODO: handle

      const { method, url } = req;
      const matcher = method + url;
      const _routeHandler = routes.get(matcher);

      if (!_routeHandler) return res.end(); // TODO: handle a 404

      const response = await _routeHandler({ request: req, response: res });
      console.log(response instanceof Error);

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.write('hello');
      res.end();
    });

    server.listen(port, cb ?? (() => {
      console.log(`RicApi listening on http://localhost:${port}`)
    }));
  },
};

function RicApi(): IRicApi {
  return routeDefinitions;
}

class Error {
  private statusCode: number;
  private message: any;

  constructor(statusCode: number, message: any) {
    this.statusCode = statusCode;
    this.message = message;
  }
}

export {
  RicApi,
  Error,
}

