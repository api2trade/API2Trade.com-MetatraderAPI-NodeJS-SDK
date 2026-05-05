export class Api2TradeError extends Error {
  public statusCode?: number;
  public responseBody?: any;

  constructor(message: string, statusCode?: number, responseBody?: any) {
    super(message);
    this.name = 'Api2TradeError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class AuthenticationError extends Api2TradeError {
  constructor(message = 'Authentication failed. Check your API key or credentials.') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AccountNotFoundError extends Api2TradeError {
  public accountId: string;

  constructor(accountId: string, responseBody?: any) {
    super(`Account '${accountId}' not found. Register the account first.`, 404, responseBody);
    this.name = 'AccountNotFoundError';
    this.accountId = accountId;
  }
}

export class RateLimitError extends Api2TradeError {
  public retryAfter?: number;

  constructor(retryAfter?: number, responseBody?: any) {
    const msg = retryAfter ? `Rate limit exceeded. Retry after ${retryAfter}s.` : 'Rate limit exceeded.';
    super(msg, 429, responseBody);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends Api2TradeError {
  constructor(message = 'Internal server error.', statusCode = 500, responseBody?: any) {
    super(message, statusCode, responseBody);
    this.name = 'ServerError';
  }
}

export class BrokerRejectionError extends Api2TradeError {
  public retcode: number;
  public comment: string;
  public isRetryable: boolean;

  constructor(retcode: number, comment = '', isRetryable = false, responseBody?: any) {
    super(`Broker rejection retcode=${retcode}${comment ? ` (comment: ${comment})` : ''}`, 200, responseBody);
    this.name = 'BrokerRejectionError';
    this.retcode = retcode;
    this.comment = comment;
    this.isRetryable = isRetryable;
  }
}
