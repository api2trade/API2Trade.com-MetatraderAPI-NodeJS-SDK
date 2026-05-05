/**
 * Operation codes for OrderSend.
 * These map directly to MetaTrader order types.
 */
export enum OrderType {
  BUY_MARKET = 0,
  SELL_MARKET = 1,
  BUY_LIMIT = 2,
  SELL_LIMIT = 3,
  BUY_STOP = 4,
  SELL_STOP = 5,
}

export const OrderTypeHelpers = {
  isMarket(type: OrderType): boolean {
    return type === OrderType.BUY_MARKET || type === OrderType.SELL_MARKET;
  },
  isPending(type: OrderType): boolean {
    return [
      OrderType.BUY_LIMIT,
      OrderType.SELL_LIMIT,
      OrderType.BUY_STOP,
      OrderType.SELL_STOP,
    ].includes(type);
  },
};

/**
 * Broker-level retcode values returned by OrderSend / OrderModify.
 * A retcode of 0 means success.
 */
export enum RetCode {
  SUCCESS = 0,
  REQUOTE = 10004,
  REJECTED = 10006,
  CANCELED = 10007,
  ORDER_PLACED = 10008,
  COMPLETED = 10009,
  PARTIAL_FILL = 10010,
  PROCESSING_ERROR = 10011,
  CANCELED_TIMEOUT = 10012,
  INVALID_REQUEST = 10013,
  INVALID_VOLUME = 10014,
  INVALID_PRICE = 10015,
  INVALID_STOPS = 10016,
  TRADE_DISABLED = 10017,
  MARKET_CLOSED = 10018,
  INSUFFICIENT_FUNDS = 10019,
  PRICES_CHANGED = 10020,
  NO_QUOTES = 10021,
  INVALID_EXPIRATION = 10022,
  ORDER_CHANGED = 10023,
  TOO_MANY_REQUESTS = 10024,
  NO_CHANGES = 10025,
  AUTOTRADING_DISABLED = 10026,
  AGENT_BLOCKED = 10027,
  ORDER_FROZEN = 10028,
  INVALID_FILL = 10029,
  NO_CONNECTION = 10030,
  INSUFFICIENT_RIGHTS = 10031,
  TOO_FREQUENT = 10032,
  NO_CHANGES_IN_REQUEST = 10033,
  SERVER_BUSY = 10034,
  ORDER_LOCKED = 10035,
  LONG_ONLY = 10036,
  TOO_MANY_POSITIONS = 10037,
}

export const RetCodeHelpers = {
  isRetryable(code: number): boolean {
    return [
      RetCode.REQUOTE,
      RetCode.CANCELED,
      RetCode.PROCESSING_ERROR,
      RetCode.CANCELED_TIMEOUT,
      RetCode.PRICES_CHANGED,
      RetCode.SERVER_BUSY,
    ].includes(code);
  },
};

export interface ConnectStatus {
  connected: boolean;
  id: string;
}

export interface RegisteredAccount {
  id: string;
  status: string;
}

export interface AccountSummary {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
}

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
}

export interface OrderResult {
  ticket: number;
  retcode: number;
  comment: string;
}

export interface Position {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  stopLoss: number;
  takeProfit: number;
  profit: number;
  swap: number;
  comment: string;
}

export interface OrderHistoryItem {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  profit: number;
  swap: number;
  commission: number;
  comment: string;
}

export interface PaginatedHistory {
  data: OrderHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Tick {
  symbol: string;
  bid: number;
  ask: number;
  type: string;
}
