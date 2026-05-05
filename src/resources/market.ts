import { HttpClient } from '../http';
import { Quote } from '../types';

export class MarketResource {
  constructor(private http: HttpClient) {}

  public async quote(accountId: string, symbol: string): Promise<Quote> {
    return this.http.get<Quote>('/GetQuote', { id: accountId, symbol });
  }

  public async quotes(accountId: string, symbols: string[]): Promise<Quote[]> {
    return Promise.all(symbols.map(sym => this.quote(accountId, sym)));
  }
}
