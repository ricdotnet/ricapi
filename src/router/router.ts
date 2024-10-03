import type { Route } from '../types';
import { HttpMethod } from './HttpMethod';
import type { Context } from './context';

const routes: Route[] = [];

function addRoute(path: string, method: HttpMethod, _routes = routes) {
  const parts = path.split('/').filter(Boolean);
  const isLastPart = parts.length === 1;

  const match = _routes.find((r) => {
    if (isLastPart) {
      return r.path === parts[0] && r.method === method;
    }
    return r.path === parts[0];
  });

  let routeDef = match;

  if (!routeDef) {
    routeDef = {
      method: HttpMethod.GET, // set get by default
      path: parts[0],
      children: [],
      handler: null,
    };
  }

  if (isLastPart) {
    _routes.push(routeDef);
    return routeDef;
  }

  if (!match) {
    _routes.push(routeDef);
  }

  parts.shift(); // pop the current parent
  return addRoute(parts.join('/'), method, routeDef.children);
}

function findPartMatch(pathParts: string[], children: Route[], context: Context) {
  const isLastPart = pathParts.length === 1;

  for (const part of pathParts) {
    for (const child of children) {
      if (child.path.startsWith(':')) {
        const match = children.find((r) => {
          if (isLastPart) {
            return r.path === part && r.method === context.method;
          }
          return r.path === part;
        });

        if (match) {
          return match;
        }

        if (isLastPart) {
          if (child.method === context.method) {
            context.setParam(child.path.slice(1), part); // set the param
            return child;
          }
          continue;
        }

        context.setParam(child.path.slice(1), part); // set the param
        return child;
      }

      if (isLastPart) {
        if (child.path === part && child.method === context.method) {
          return child;
        }
        continue;
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

export { routes, addRoute, findMatch };
