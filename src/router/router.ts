import type { Route, RouteHandlerFunction } from '../types';
import type { HttpMethod } from './HttpMethod';
import type { Context } from './context';

const routes: Route[] = [];
const globalMiddlewares: RouteHandlerFunction[] = [];

function addRoute(path: string, handler: RouteHandlerFunction, method: HttpMethod, _routes = routes) {
  const parts = path.split('/').filter(Boolean);
  const isLastPart = parts.length === 1;

  const match = _routes.find((r) => {
    return r.path === parts[0];
  });

  let routeDef = match;

  if (!routeDef) {
    routeDef = {
      path: parts[0],
      children: [],
      handler: {},
    };
  }

  if (isLastPart) {
    routeDef.handler = {
      ...routeDef.handler,
      [method]: handler,
    };

    if (!match) {
      _routes.push(routeDef);
    }
    return routeDef;
  }

  if (!match) {
    _routes.push(routeDef);
  }

  parts.shift(); // pop the current parent
  return addRoute(parts.join('/'), handler, method, routeDef.children);
}

function findPartMatch(pathParts: string[], children: Route[], context: Context) {
  const isLastPart = pathParts.length === 1;

  for (const part of pathParts) {
    for (const child of children) {
      if (child.path.startsWith(':')) {
        const match = children.find((r) => {
          return r.path === part;
        });

        if (match) {
          return match;
        }

        if (isLastPart) {
          context.setParam(child.path.slice(1), part); // set the param
          return child;
        }

        context.setParam(child.path.slice(1), part); // set the param
        return child;
      }

      if (child.path === part) {
        return child;
      }
    }
  }
}

function findMatch(pathParts: string[], children: Route[], context: Context): Route | undefined {
  const match = findPartMatch(pathParts, children, context);

  if (!match) {
    return;
  }

  if (pathParts.length === 1) {
    return match;
  }

  pathParts.shift(); // pop the current parent
  return findMatch(pathParts, match.children, context);
}

export { routes, addRoute, findMatch, globalMiddlewares };
