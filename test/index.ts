import { RicApi } from '../src';
import { Context } from '../src/router/context';

interface Body {
  name: string;
  surname: string;
  age: number;
}

RicApi()
  .get('/hello', () => {})
  .get('/world', (context: Context<Body>) => {

    const response = context.response;

    context.setHeader('custom-1', 'custom header 1');
    context.setHeader('custom-2', 'custom header 2')

    response.writeHead(200, { 'content-type': 'text/plain' });
    response.write('returned in the custom route handler body');
    response.end();
  })
  .start(3000);
