import { RicApi, Context } from '../src';
import { RicApiError } from '../src/errors';

const sleep = (ms = 1000) => new Promise(res => setTimeout(res, ms));

interface HelloResponse {
  name: string;
  surname: string;
}

interface WorldResponse {
  age: number;
  country: string;
}

const handler = (msg: string) => (ctx: Context) => {
  ctx.setHeader('content-type', 'text/plain');
  ctx.response(msg);
  ctx.send();
}

RicApi()
  .get('/site/all', handler('get all sites'))
  .get('/site/:id', handler('get site by id'))
  .post('/site', handler('create a site'))
  .patch('/site/:id', handler('update a site by id'))
  .patch('/site/:id/status', handler('update site status'))
  .delete('/site', handler('delete site'))
  .get('/error', () => {
    throw new RicApiError(401, 'This is a RicApiError Forbidden');
  })
  .get('/error2', () => {
    throw new Error();
  })
  .get('/hello', (ctx: Context<any, HelloResponse>) => {

    ctx.statusCode = 201;

    ctx.setHeader('content-type', 'application/json');
    ctx.response({ name: 'John', surname: 'Doe' });
  })
  .notFound((ctx: Context) => {
    ctx.setHeader('content-type', 'text/plain');
    ctx.response('Route not found', 404);
    ctx.send();
  })
  .start(3000);
