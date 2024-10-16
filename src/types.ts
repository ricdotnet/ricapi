import type { RicApiError } from './errors';
import type { HttpMethod } from './router/HttpMethod';
import type { Context } from './router/context';
import type { Response } from './router/response';

export type ResponseOptions = {
  status?: number;
  headers?: Record<string, string>;
};

export type RouteHandler = { [key in keyof typeof HttpMethod]?: RouteHandlerFunction };
export type RouteHandlerFunction = (
  // biome-ignore lint/suspicious/noExplicitAny: generic handling...
  context: Context<any, any>,
  // biome-ignore lint/suspicious/noConfusingVoidType: we can return a RicApiError or nothing at all
) => (void | Response | RicApiError) | Promise<void | Response | RicApiError>;
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
  config?: (config: { [key: string]: string }) => IRicApi;
  globalMiddlewares?: (middlewares: RouteHandlerFunction[]) => IRicApi;
  get: RouteDefinition;
  post: RouteDefinition;
  put: RouteDefinition;
  patch: RouteDefinition;
  delete: RouteDefinition;
  options: RouteDefinition;
  notFound: (cb: (context: Context) => void) => IRicApi; // TODO: handle this
  start: (port: number, cb?: () => void) => void;
}
