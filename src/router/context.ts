import { IncomingMessage, ServerResponse } from "http";

type Headers = Map<string, string | string[]>;

export class Context<RequestBody> {
  private _request: IncomingMessage;
  private _response: ServerResponse;

  private _headers: Headers = new Map();

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

  // the raw request should be available here... just in case it is needed
  get request(): IncomingMessage {
    return this._request;
  }

  // the raw response should be available here... just in case it is needed
  get response(): ServerResponse {
    return this._response;
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
    this.response.setHeader(header, value);
  }

  // TODO: parse the request body into json or form-type... depending on the content-type header
  // also maybe it would be good to define the request body interface on the route definition?

  body(): RequestBody {
    return {} as RequestBody;
  }
}
