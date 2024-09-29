import type { Context } from './router/context';
import { Error } from './errors';
import { HttpMethod } from './router/HttpMethod';

export type RouteHandler = (context: Context) => (void | Error) | Promise<void | Error>;
export type RouteDefinition = (path: string, handlers: RouteHandler | RouteHandler[]) => IRicApi;

export type RouteMap = Map<string, RouteInterface>;
export type Route = { method: HttpMethod, path: string, handler: RouteHandler | null, children: Route[], middlewares?: RouteHandler[] };

export interface RouteInterface {
  middlewares?: RouteHandler[];
  handler: RouteHandler;
}

export interface IRicApi {
  globalMiddlewares?: (middlewares: RouteHandler[]) => IRicApi;
  get: RouteDefinition;
  post: RouteDefinition;
  put: RouteDefinition;
  patch: RouteDefinition;
  delete: RouteDefinition;
  options: RouteDefinition;
  notFound: (cb: (context: Context) => void) => IRicApi; // TODO: handle this
  start: (port: number, cb?: (() => void)) => void;
}
