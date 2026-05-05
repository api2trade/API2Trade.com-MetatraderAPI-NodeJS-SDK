import { HttpClient } from '../http';
import { OrderResult, Position, OrderType, RetCodeHelpers } from '../types';
import { BrokerRejectionError } from '../exceptions';

export class OrdersResource {
  constructor(
    private http: HttpClient,
    private defaultRetryCount = 2,
    private defaultRetryDelay = 1000
  ) {}

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async send(
    accountId: string,
    symbol: string,
    orderType: OrderType | number,
    volume: number,
    stopLoss = 0.0,
    takeProfit = 0.0,
    price?: number,
    comment = 'api2trade-js',
    autoRetry = true,
    maxRetries = this.defaultRetryCount
  ): Promise<OrderResult> {
    const payload: any = {
      symbol,
      operation: orderType,
      volume,
      stopLoss,
      takeProfit,
      comment
    };
    
    if (price !== undefined) {
      payload.price = price;
    }

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const data = await this.http.post<any>('/OrderSend', { id: accountId }, payload);
      const result: OrderResult = {
        ticket: Number(data.ticket || 0),
        retcode: Number(data.retcode ?? -1),
        comment: String(data.comment || '')
      };

      if (result.retcode === 0) {
        return result;
      }

      const isRetryable = RetCodeHelpers.isRetryable(result.retcode);
      if (autoRetry && isRetryable && attempt <= maxRetries) {
        await this.sleep(this.defaultRetryDelay * attempt);
        continue;
      }

      throw new BrokerRejectionError(result.retcode, result.comment, isRetryable, data);
    }

    throw new Error('Unreachable code reached in send');
  }

  public async modify(
    accountId: string,
    ticket: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<OrderResult> {
    if (stopLoss === undefined && takeProfit === undefined) {
      throw new Error('Provide at least one of stopLoss or takeProfit to modify.');
    }

    const payload: any = { ticket };
    if (stopLoss !== undefined) payload.stopLoss = stopLoss;
    if (takeProfit !== undefined) payload.takeProfit = takeProfit;

    const data = await this.http.post<any>('/OrderModify', { id: accountId }, payload);
    const result: OrderResult = {
      ticket: Number(data.ticket || 0),
      retcode: Number(data.retcode ?? -1),
      comment: String(data.comment || '')
    };

    if (result.retcode !== 0) {
      throw new BrokerRejectionError(result.retcode, result.comment, false, data);
    }
    return result;
  }

  public async close(
    accountId: string,
    ticket: number,
    volume?: number
  ): Promise<OrderResult> {
    const payload: any = { ticket };
    if (volume !== undefined) payload.volume = volume;

    const data = await this.http.post<any>('/OrderClose', { id: accountId }, payload);
    const result: OrderResult = {
      ticket: Number(data.ticket || 0),
      retcode: Number(data.retcode ?? -1),
      comment: String(data.comment || '')
    };

    if (result.retcode !== 0) {
      throw new BrokerRejectionError(result.retcode, result.comment, false, data);
    }
    return result;
  }

  public async closeAll(accountId: string): Promise<OrderResult[]> {
    const openPositions = await this.positions(accountId);
    const results: OrderResult[] = [];
    
    for (const pos of openPositions) {
      results.push(await this.close(accountId, pos.ticket, pos.volume));
    }
    return results;
  }

  public async positions(accountId: string): Promise<Position[]> {
    const data = await this.http.get<any>('/Positions', { id: accountId });
    if (Array.isArray(data)) {
      return data.map(item => ({
        ticket: Number(item.ticket || 0),
        symbol: String(item.symbol || ''),
        type: String(item.type || ''),
        volume: Number(item.volume || 0),
        openPrice: Number(item.openPrice || 0),
        stopLoss: Number(item.stopLoss || 0),
        takeProfit: Number(item.takeProfit || 0),
        profit: Number(item.profit || 0),
        swap: Number(item.swap || 0),
        comment: String(item.comment || '')
      }));
    }
    return [];
  }
}
