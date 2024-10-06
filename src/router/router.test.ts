import type { IncomingMessage, ServerResponse } from 'node:http';
import { expect, test, vi } from 'vitest';
import { HttpMethod } from './HttpMethod';
import { Context } from './context';
import { addRoute, findMatch, routes } from './router';

const handler = (ctx: Context) => {};

test('router should have all the top routes', () => {
  addRoute('/home', handler, HttpMethod.GET, routes);
  addRoute('/about', handler, HttpMethod.GET, routes);
  addRoute('/contact', handler, HttpMethod.GET, routes);
  addRoute('/blog', handler, HttpMethod.GET, routes);

  expect(routes).toHaveLength(4);
});

test('router should have all the nested routes', () => {
  addRoute('/home', handler, HttpMethod.GET, routes);
  addRoute('/home/about', handler, HttpMethod.GET, routes);
  addRoute('/home/contact', handler, HttpMethod.GET, routes);
  addRoute('/home/blog', handler, HttpMethod.GET, routes);

  expect(routes[0].children).toHaveLength(3);
});

test('should find the correct route', () => {
  addRoute('/home', handler, HttpMethod.GET, routes);
  addRoute('/home/about', handler, HttpMethod.GET, routes);
  addRoute('/home/contact', handler, HttpMethod.GET, routes);
  addRoute('/home/blog', handler, HttpMethod.GET, routes);

  const route = findMatch('home/about'.split('/'), routes, {} as Context);

  expect(route).toBeDefined();
  expect(route?.path).toBe('about');
});

test('should call the correct route handler', () => {
  const homeHandlerMock = vi.fn(() => {});

  addRoute('/home', homeHandlerMock, HttpMethod.GET, routes);
  const route = findMatch('home'.split('/'), routes, {} as Context);

  expect(route).toBeDefined();

  // biome-ignore lint/style/noNonNullAssertion: We will always have a route with a handler here
  route!.handler[HttpMethod.GET]!({} as Context);

  expect(homeHandlerMock).toHaveBeenCalled();
  expect(homeHandlerMock).toHaveBeenCalledTimes(1);
});

test('should call the correct route handler with params', () => {
  const homeIdHandlerMock = vi.fn(() => {});
  const homeAllHandlerMock = vi.fn(() => {});

  addRoute('/home/:id', homeIdHandlerMock, HttpMethod.GET, routes);
  addRoute('/home/all', homeAllHandlerMock, HttpMethod.GET, routes);
  const route = findMatch('home/1'.split('/'), routes, new Context({} as IncomingMessage, {} as ServerResponse));

  expect(route).toBeDefined();

  // biome-ignore lint/style/noNonNullAssertion: We will always have a route with a handler here
  route!.handler[HttpMethod.GET]!({} as Context);

  expect(homeIdHandlerMock).toHaveBeenCalled();
  expect(homeIdHandlerMock).toHaveBeenCalledTimes(1);
  expect(homeAllHandlerMock).not.toHaveBeenCalled();
  expect(homeAllHandlerMock).toHaveBeenCalledTimes(0);
});

test('should have all route params in the context', () => {
  const userIdHandlerMock = vi.fn(() => {});

  const context = new Context({} as IncomingMessage, {} as ServerResponse);

  addRoute('/user/:id/:type', userIdHandlerMock, HttpMethod.GET, routes);
  const route = findMatch('user/1/admin'.split('/'), routes, context);

  expect(route).toBeDefined();

  // biome-ignore lint/style/noNonNullAssertion: We will always have a route with a handler here
  route!.handler[HttpMethod.GET]!(context);

  expect(userIdHandlerMock).toHaveBeenCalled();
  expect(userIdHandlerMock).toHaveBeenCalledTimes(1);
  expect(context.getParam('id')).toEqual('1');
  expect(context.getParam('type')).toEqual('admin');
});

test('should call the correct route handler with the correct method', () => {
  const homeHandlerGetMock = vi.fn(() => {});
  const homeHandlerPostMock = vi.fn(() => {});

  const methodToCall = HttpMethod.POST;

  addRoute('/home', homeHandlerGetMock, HttpMethod.GET, routes);
  addRoute('/home', homeHandlerPostMock, methodToCall, routes);
  const route = findMatch('home'.split('/'), routes, {} as Context);

  expect(route).toBeDefined();

  // biome-ignore lint/style/noNonNullAssertion: We will always have a route with a handler here
  route!.handler[methodToCall]!({} as Context);

  expect(homeHandlerGetMock).not.toHaveBeenCalled();
  expect(homeHandlerGetMock).toHaveBeenCalledTimes(0);
  expect(homeHandlerPostMock).toHaveBeenCalled();
  expect(homeHandlerPostMock).toHaveBeenCalledTimes(1);
});
