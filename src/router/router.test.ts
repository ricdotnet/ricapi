import { expect, test, vi } from 'vitest';
import type { RicApiError } from '../errors';
import { HttpMethod } from './HttpMethod';
import type { Context } from './context';
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
