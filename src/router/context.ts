import { IncomingMessage, ServerResponse } from "http";

type Headers = Map<string, string | string[]>;

export class Context<RequestBody = any, ResponseBody = any, ContextData = any> {
  private readonly _request: IncomingMessage;
  private readonly _response: ServerResponse;

  private _headers: Headers = new Map();

  private _body: RequestBody = {} as RequestBody;
  private _data: ContextData = {} as ContextData;
  private _params: any = {} = {};

  constructor(request: IncomingMessage, response: ServerResponse) {
    this._request = request;
    this._response = response;

    Object.keys(this._request.headers).forEach((key: string) => {
      const header: string[] | string | undefined = this._request.headers[key];
      if (header) {
        this._headers.set(key, header);
      }
    });
  }

  get data(): ContextData {
    return this._data;
  }

  // the raw request should be available here... just in case it is needed
  get __request(): IncomingMessage {
    return this._request;
  }

  // the raw response should be available here... just in case it is needed
  get __response(): ServerResponse {
    return this._response;
  }

  // set a specific custom url param
  setParam(key: string, value: any) {
    this._params[key] = value;
  }
  
  // get all the params
  getParams(): any {
    return this._params;
  }
  
  // get a specific param... or undefined
  getParam(param: string): any {
    return this._params[param];
  }

  // get all the headers of a request
  getHeaders(): Headers {
    return this._headers;
  }

  // get a specific header... or undefined
  getHeader(header: string): string | string[] | undefined {
    return this._headers.get(header.toLowerCase());
  }

  setHeader(header: string, value: string | number | string[]) {
    this._response.setHeader(header, value);
  }

  // TODO: parse the request body into json or form-type... depending on the content-type header
  // also maybe it would be good to define the request body interface on the route definition?

  setBody(body: RequestBody) {
    this._body = body;
  }

  body(): RequestBody {
    return this._body;
  }

  response(data: ResponseBody, statusCode: number = 200) {
    const buffer = Buffer.from(JSON.stringify(data));

    this._response.setHeader('content-length', buffer.length);
    this._response.writeHead(statusCode);
    this._response.write(buffer);
  }

  send() {
    this._response.end();
  }
}
