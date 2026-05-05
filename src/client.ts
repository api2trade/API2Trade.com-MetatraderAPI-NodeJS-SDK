import { HttpClient, HttpClientOptions } from './http';
import { StreamingClient, TickCallback, ErrorCallback, ConnectCallback } from './streaming';
import { AccountsResource } from './resources/accounts';
import { MarketResource } from './resources/market';
import { OrdersResource } from './resources/orders';
import { HistoryResource } from './resources/history';
import { Tick } from './types';

export interface Api2TradeClientOptions extends HttpClientOptions {
  wsBaseUrl?: string;
  maxReconnects?: number;
}

export class Api2TradeClient {
  private http: HttpClient;
  private streaming: StreamingClient;

  public readonly accounts: AccountsResource;
  public readonly market: MarketResource;
  public readonly orders: OrdersResource;
  public readonly history: HistoryResource;

  constructor(options: Api2TradeClientOptions = {}) {
    const apiKey = options.apiKey || (typeof process !== 'undefined' ? process.env.API2TRADE_API_KEY : undefined);
    const baseUrl = options.baseUrl || (typeof process !== 'undefined' ? process.env.API2TRADE_BASE_URL : undefined);
    const wsBaseUrl = options.wsBaseUrl || (typeof process !== 'undefined' ? process.env.API2TRADE_WS_URL : undefined);

    this.http = new HttpClient({
      ...options,
      apiKey,
      baseUrl
    });

    this.streaming = new StreamingClient(
      apiKey,
      options.proUsername,
      options.proPassword,
      wsBaseUrl,
      options.maxReconnects
    );

    this.accounts = new AccountsResource(this.http);
    this.market = new MarketResource(this.http);
    this.orders = new OrdersResource(this.http);
    this.history = new HistoryResource(this.http);
  }

  public async stream(
    accountId: string,
    symbols: string[],
    onTick: TickCallback,
    onError?: ErrorCallback,
    onConnect?: ConnectCallback,
    onDisconnect?: ConnectCallback
  ): Promise<void> {
    return this.streaming.stream(accountId, symbols, onTick, onError, onConnect, onDisconnect);
  }

  public streamIter(accountId: string, symbols: string[]): AsyncGenerator<Tick, void, unknown> {
    return this.streaming.streamIter(accountId, symbols);
  }

  public close(): void {
    this.streaming.close();
  }
}
