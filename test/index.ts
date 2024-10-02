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

RicApi()
  .get('/post/:name', (ctx: Context) => {

    ctx.setHeader('content-type', 'text/plain');
    ctx.response('this is /post with get: ' + ctx.getParam('name'));
    ctx.send();
  })
  .post('/post/:name', (ctx: Context) => {

    ctx.setHeader('content-type', 'text/plain');
    ctx.response('this is /post with post: ' + ctx.getParam('name'));
    ctx.send();
  })
  .start(3000);
