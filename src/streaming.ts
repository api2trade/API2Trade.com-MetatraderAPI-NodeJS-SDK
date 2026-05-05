import WebSocket from 'isomorphic-ws';
import { Tick } from './types';

export type TickCallback = (tick: Tick) => void;
export type ErrorCallback = (error: Error) => void;
export type ConnectCallback = () => void;

export class StreamingClient {
  private ws: WebSocket | null = null;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly authHeader?: string;
  private reconnectAttempts = 0;
  private maxReconnects?: number;
  private intentionallyClosed = false;

  constructor(
    apiKey?: string,
    proUsername?: string,
    proPassword?: string,
    wsBaseUrl = 'wss://api.metatraderapi.dev/stream',
    maxReconnects?: number
  ) {
    this.baseUrl = wsBaseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.maxReconnects = maxReconnects;

    if (proUsername && proPassword) {
      if (typeof btoa !== 'undefined') {
        this.authHeader = `Basic ${btoa(`${proUsername}:${proPassword}`)}`;
      } else if (typeof Buffer !== 'undefined') {
        this.authHeader = `Basic ${Buffer.from(`${proUsername}:${proPassword}`).toString('base64')}`;
      }
    }
  }

  private buildUri(accountId: string): string {
    if (this.apiKey) {
      return `${this.baseUrl}?api_key=${this.apiKey}&id=${accountId}`;
    }
    return `${this.baseUrl}?id=${accountId}`;
  }

  public async stream(
    accountId: string,
    symbols: string[],
    onTick: TickCallback,
    onError?: ErrorCallback,
    onConnect?: ConnectCallback,
    onDisconnect?: ConnectCallback
  ): Promise<void> {
    this.intentionallyClosed = false;
    const uri = this.buildUri(accountId);
    
    const connect = () => {
      // isomorphic-ws uses third argument for headers in node, but browsers ignore it
      const options = this.authHeader ? { headers: { Authorization: this.authHeader } } : undefined;
      
      try {
        this.ws = new WebSocket(uri, undefined, options);
      } catch (err: any) {
        if (onError) onError(err);
        this.handleReconnect(accountId, symbols, onTick, onError, onConnect, onDisconnect);
        return;
      }

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        if (onConnect) onConnect();
        this.ws?.send(JSON.stringify({ action: 'subscribe', symbols }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString());
          if (data.type === 'quote') {
            onTick(data as Tick);
          } else if (data.type === 'error') {
            if (onError) onError(new Error(`Server stream error: ${JSON.stringify(data)}`));
          }
        } catch (e) {
          // parse error
        }
      };

      this.ws.onerror = (event) => {
        if (onError) onError(new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        if (this.intentionallyClosed) return;
        if (onDisconnect) onDisconnect();
        this.handleReconnect(accountId, symbols, onTick, onError, onConnect, onDisconnect);
      };
    };

    connect();
  }

  private handleReconnect(
    accountId: string,
    symbols: string[],
    onTick: TickCallback,
    onError?: ErrorCallback,
    onConnect?: ConnectCallback,
    onDisconnect?: ConnectCallback
  ) {
    if (this.intentionallyClosed) return;
    
    this.reconnectAttempts++;
    if (this.maxReconnects !== undefined && this.reconnectAttempts > this.maxReconnects) {
      if (onError) onError(new Error('Max reconnect attempts reached.'));
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    setTimeout(() => {
      this.stream(accountId, symbols, onTick, onError, onConnect, onDisconnect);
    }, delay);
  }

  public close() {
    this.intentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Support for async iterator (simplified for Node/Browser compatibility)
  public async *streamIter(accountId: string, symbols: string[]): AsyncGenerator<Tick, void, unknown> {
    let resolver: ((tick: Tick) => void) | null = null;
    const queue: Tick[] = [];
    
    this.stream(accountId, symbols, (tick) => {
      if (resolver) {
        resolver(tick);
        resolver = null;
      } else {
        queue.push(tick);
      }
    });

    try {
      while (!this.intentionallyClosed) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          yield await new Promise<Tick>(resolve => {
            resolver = resolve;
          });
        }
      }
    } finally {
      this.close();
    }
  }
}
