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

const helloMiddleware = async (ctx: Context<WorldResponse, HelloResponse>) => {
  console.log('Hello middleware');
  ctx.data.age = 30;
  ctx.data.country = 'Portugal';
  
  await sleep(5000);
};

const helloHandler = async (ctx: Context<WorldResponse, HelloResponse>) => {
  console.log(ctx.data);
  
  ctx.setHeader('content-type', 'application/json');
  ctx.response(ctx.data);
  ctx.send();
};

RicApi()
  .get('/hello', [helloMiddleware, helloHandler])
  .start(3000);