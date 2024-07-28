import { RicApi } from '../src';
import { Context } from '../src/router/context';

const sleep = (ms = 1000) => new Promise(res => setTimeout(res, ms));

interface HelloResponse {
  name: string;
  surname: string;
}

interface WorldResponse {
  age: number;
  country: string;
}

RicApi()
  .get('/hello', async (ctx: Context<WorldResponse, HelloResponse>) => {
  
    await sleep();

    // ctx.__response.write('/hello route');
    // ctx.__response.end();

    ctx.setHeader('content-type', 'application/json');
    ctx.response({ name: 'Ricardo', surname: 'Rocha'});
    ctx.send();
  })
  .get('/world', (ctx: Context) => {

    ctx.__response.write('/world route');
    ctx.__response.end();
  })
  .notFound((ctx: Context) => {
    ctx.setHeader('content-type', 'application/json');
    ctx.response({ status: 400, error: 'Not found' }, 404);
    ctx.send();
  })
  .start(3000);
