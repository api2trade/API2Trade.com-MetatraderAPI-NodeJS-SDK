import { HttpClient } from '../http';
import { OrderHistoryItem, PaginatedHistory } from '../types';

type DateLike = string | Date;

export class HistoryResource {
  constructor(private http: HttpClient) {}

  private toIso(dt: DateLike): string {
    if (dt instanceof Date) {
      return dt.toISOString();
    }
    return dt;
  }

  public async get(accountId: string, dateFrom: DateLike, dateTo: DateLike): Promise<OrderHistoryItem[]> {
    const data = await this.http.get<any>('/OrderHistory', {
      id: accountId,
      dateFrom: this.toIso(dateFrom),
      dateTo: this.toIso(dateTo)
    });
    
    if (Array.isArray(data)) {
      return data.map(item => this.mapHistoryItem(item));
    }
    return [];
  }

  public async getPage(
    accountId: string,
    dateFrom: DateLike,
    dateTo: DateLike,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedHistory> {
    const data = await this.http.get<any>('/OrderHistoryPagination', {
      id: accountId,
      dateFrom: this.toIso(dateFrom),
      dateTo: this.toIso(dateTo),
      page,
      pageSize
    });

    return {
      data: (data.data || []).map((item: any) => this.mapHistoryItem(item)),
      total: Number(data.total || 0),
      page: Number(data.page || 1),
      pageSize: Number(data.pageSize || 50)
    };
  }

  public async *iterAll(
    accountId: string,
    dateFrom: DateLike,
    dateTo: DateLike,
    pageSize = 50
  ): AsyncGenerator<OrderHistoryItem, void, unknown> {
    let page = 1;
    while (true) {
      const result = await this.getPage(accountId, dateFrom, dateTo, page, pageSize);
      for (const item of result.data) {
        yield item;
      }
      
      const totalPages = Math.ceil(result.total / result.pageSize);
      if (page >= totalPages || result.data.length === 0) {
        break;
      }
      page++;
    }
  }

  public async summaryStats(accountId: string, dateFrom: DateLike, dateTo: DateLike) {
    const orders = await this.get(accountId, dateFrom, dateTo);
    
    const profits = orders.map(o => o.profit + o.swap + o.commission);
    const winners = profits.filter(p => p > 0);
    const losers = profits.filter(p => p < 0);

    const grossProfit = winners.reduce((sum, p) => sum + p, 0);
    const grossLoss = losers.reduce((sum, p) => sum + p, 0);
    const netProfit = grossProfit + grossLoss;

    return {
      totalTrades: orders.length,
      winningTrades: winners.length,
      losingTrades: losers.length,
      winRate: profits.length ? winners.length / profits.length : 0,
      grossProfit,
      grossLoss,
      netProfit,
      profitFactor: grossLoss !== 0 ? Math.abs(grossProfit / grossLoss) : Infinity
    };
  }

  private mapHistoryItem(item: any): OrderHistoryItem {
    return {
      ticket: Number(item.ticket || 0),
      symbol: String(item.symbol || ''),
      type: String(item.type || ''),
      volume: Number(item.volume || 0),
      openPrice: Number(item.openPrice || 0),
      closePrice: Number(item.closePrice || 0),
      openTime: String(item.openTime || ''),
      closeTime: String(item.closeTime || ''),
      profit: Number(item.profit || 0),
      swap: Number(item.swap || 0),
      commission: Number(item.commission || 0),
      comment: String(item.comment || '')
    };
  }
}
