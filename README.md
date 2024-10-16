# @ricdotnet/api

### Usage
```shell
# npm
npm install @ricdotnet/api

#yarn
yarn add @ricdotnet/api
```

```js
import { RicApi, Response } from "@ricdotnet/api";

class User {
  set name(value) {
    this._name = value;
  }
  set country(value) {
    this._country = value;
  }
  get name() {
    return this._name;
  }
  get country() {
    return this._country;
  }
}

RicApi()
  .get('/hello', (context) => {
    return new Response('[GET] Hello World!');
  })
  .post('/hello', (context) => {
    const body = context.body;

    return new Response('[POST] Hello World!', {
      status: 201,
      headers: {
        'header-key-1': 'value-1',
        'header-key-2': 'value-2',
      },
    });
  })
  .get('/hello/:name', (context) => {
    return new Response(`Hello ${context.params.name}!`);
  })
  .get('/hello/:name/:country', (context) => {
    const response = new Response();
    const user = new User();

    user.name = context.params.name;
    user.country = context.params.country;

    response.body = user;

    return response;
  })
  .start(3000);
```
