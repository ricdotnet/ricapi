import { RicApi, Context } from '../src';

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
};

const helloHandler = async (ctx: Context<WorldResponse, HelloResponse>) => {
  console.log(ctx.body());

  ctx.setHeader('content-type', 'application/json');
  ctx.response({ name: 'John', surname: 'Doe' });
  ctx.send();
};

RicApi()
  .get('/hello', [helloMiddleware, helloHandler])
  .start(3000);
