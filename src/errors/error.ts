export class Error {
  private _statusCode: number;
  private _message: string;
  private _data: any;

  constructor(statusCode: number, message: string, data?: any) {
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
