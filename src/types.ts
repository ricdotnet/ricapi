import type { RicApiError } from './errors';
import type { HttpMethod } from './router/HttpMethod';
import type { Context } from './router/context';

export type RouteHandler = { [key in keyof typeof HttpMethod]?: RouteHandlerFunction };
// biome-ignore lint/suspicious/noConfusingVoidType: we can return a RicApiError or nothing at all
export type RouteHandlerFunction = (context: Context) => (void | RicApiError) | Promise<void | RicApiError>;
export type RouteDefinition = (path: string, handlers: RouteHandlerFunction | RouteHandlerFunction[]) => IRicApi;

export type Route = {
  path: string;
  handler: RouteHandler;
  children: Route[];
  middlewares?: RouteHandlerFunction[];
};

export interface RouteInterface {
  middlewares?: RouteHandlerFunction[];
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
