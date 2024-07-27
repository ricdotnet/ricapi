import { RicApi, Error } from '../src';

RicApi()
  .get('/hello', () => {
    console.log('the hello route');
    return new Error(400, 'Something went wrong');
  })
  .get('/world', () => {
    console.log('the world route');
  })
  .start(3000);
