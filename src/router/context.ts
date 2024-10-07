import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpMethod } from './HttpMethod';

type Headers = Map<string, string | string[]>;

export class Context<RequestBody = unknown, ResponseBody = unknown, ContextData = unknown> {
  private readonly _request: IncomingMessage;
  private readonly _response: ServerResponse;
  private readonly _method: keyof typeof HttpMethod;

  private readonly _headers: Headers = new Map();
  private readonly _data: ContextData = {} as ContextData;

  private _body: RequestBody = {} as RequestBody;
  private _params: { [key: string]: string | number } = {};
  private _statusCode: number | undefined;
  private _responseData: ResponseBody = {} as ResponseBody;

  private readonly _responseHeaders: Headers = new Map();

  constructor(request: IncomingMessage, response: ServerResponse) {
    this._request = request;
    this._response = response;
    this._method = <HttpMethod>request.method ?? HttpMethod.GET;

    for (const header in request.headers) {
      if (request.headers[header]) {
        this._headers.set(header, request.headers[header]);
      }
    }
  }

  // the raw request should be available here... just in case it is needed
  get __request(): IncomingMessage {
    return this._request;
  }

  // the raw response should be available here... just in case it is needed
  get __response(): ServerResponse {
    return this._response;
  }

  get method(): keyof typeof HttpMethod {
    return this._method;
  }

  get data(): ContextData {
    return this._data;
  }

  set statusCode(status: number) {
    this._statusCode = status;
  }

  get statusCode(): number | undefined {
    return this._statusCode;
  }

  // set the request body
  // for the response body, use the response method
  set body(body: RequestBody) {
    this._body = body;
  }

  // get the request body
  get body(): RequestBody {
    return this._body;
  }

  // get all the request headers
  get headers(): Headers {
    return this._headers;
  }

  // get all the response headers
  get responseHeaders(): Headers {
    return this._responseHeaders;
  }

  // attach a request url parameter to the params object
  setParam(key: string, value: string | number) {
    this._params[key] = value;
  }

  // get a specific request url parameter... or undefined
  getParam<T = unknown>(param: string): T {
    return <T>this._params[param];
  }

  // get all the custom request url parameters
  get params(): { [key: string]: string | number } {
    return this._params;
  }

  // get a specific header... or undefined
  getHeader(header: string): string | string[] | undefined {
    return this._headers.get(header.toLowerCase());
  }

  // set a response header
  setHeader(header: string, value: string | string[]) {
    this._responseHeaders.set(header, value);
  }

  response(data: ResponseBody, statusCode = 200) {
    const buffer = Buffer.from(JSON.stringify(data));

    if (statusCode) {
      this.statusCode = statusCode;
    }

    if (buffer.length) {
      this._response.setHeader('content-length', buffer.length);
      this._response.write(buffer);
    }
  }

  send() {
    this._response.end();
  }
}
