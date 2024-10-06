export class RicApiError extends Error {
  private readonly _statusCode: number;
  private readonly _message: string;
  private readonly _data: unknown;

  constructor(statusCode: number, message: string, data?: unknown) {
    super(message);
    this._statusCode = statusCode;
    this._message = message;

    if (data) {
      this._data = data;
    }
  }

  get statusCode() {
    return this._statusCode;
  }

  get message() {
    return this._message;
  }

  get data() {
    return this._data;
  }
}
