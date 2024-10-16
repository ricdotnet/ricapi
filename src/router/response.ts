import type { ResponseOptions } from '../types';

type Body = string | number | object;

export class Response {
  private _body: Body;
  private _status = 200;
  private _headers: Record<string, string | string[]> = {};

  constructor(body?: Body);
  constructor(body: Body, options: ResponseOptions);
  constructor(body: Body, options?: ResponseOptions) {
    this._body = body;

    if (options?.status) {
      this._status = options.status;
    }

    if (options?.headers) {
      this.setHeaders(options.headers);
    }

    this.setContentType();
  }

  get status(): number {
    return this._status;
  }

  get headers(): Record<string, string | string[]> {
    return this._headers;
  }

  get body(): Body {
    return this._body;
  }

  set status(status: number) {
    this._status = status;
  }

  set header(header: Record<string, string | string[]>) {
    this.setHeaders(header);
  }

  set body(body: Body) {
    this._body = body;
    this.setContentType();
  }

  private setContentType() {
    if (this._headers['content-type']) return; // if content-type is already set, don't override it

    if (typeof this._body === 'string') {
      this._headers['content-type'] = 'text/html';
    }

    if (typeof this._body === 'number') {
      this._headers['content-type'] = 'text/plain';
    }

    if (typeof this._body === 'object') {
      this._headers['content-type'] = 'application/json';
    }
  }

  private setHeaders(headers: Record<string, string | string[]>) {
    for (const key in headers) {
      this._headers[key] = headers[key];
    }
  }
}
