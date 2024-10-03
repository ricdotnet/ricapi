import type { RicApiError } from './errors';
import type { HttpMethod } from './router/HttpMethod';
import type { Context } from './router/context';

// biome-ignore lint/suspicious/noConfusingVoidType: we can return a RicApiError or nothing at all
export type RouteHandler = (context: Context) => (void | RicApiError) | Promise<void | RicApiError>;
export type RouteDefinition = (path: string, handlers: RouteHandler | RouteHandler[]) => IRicApi;

export type Route = {
  method: HttpMethod;
  path: string;
  handler: RouteHandler | null;
  children: Route[];
  middlewares?: RouteHandler[];
};

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
  start: (port: number, cb?: () => void) => void;
}
