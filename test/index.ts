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
  // .get('/hello', [helloMiddleware, helloHandler])
  // .get('/hello/world', (ctx: Context) => {
  //   console.log('Hello world');
    
  //   ctx.setHeader('content-type', 'application/json');
  //   ctx.response({ age: 25, country: 'PT' });
  //   ctx.send();
  // })
  // .get('/hello/world/:id', (ctx: Context) => {
  //   console.log('Hello world with id');
    
  //   const id = ctx.getParam('id');
    
  //   ctx.setHeader('content-type', 'application/json');
  //   ctx.response({ id });
  //   ctx.send();
  // })
  // .get('/hello/world/:id/:name', (ctx: Context) => {
  //   console.log('Hello world with id and name');
    
  //   const id = ctx.getParam('id');
  //   const name = ctx.getParam('name');
    
  //   ctx.setHeader('content-type', 'application/json');
  //   ctx.response({ id, name });
  //   ctx.send();
  // })
  .get('/:slug/world', (ctx: Context) => {
    console.log('Hello world with slug');
    
    const slug = ctx.getParam('slug');
    
    ctx.setHeader('content-type', 'application/json');
    ctx.response({ slug });
    ctx.send();
  })
  .start(3000);
