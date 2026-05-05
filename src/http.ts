import {
  Api2TradeError,
  AuthenticationError,
  AccountNotFoundError,
  RateLimitError,
  ServerError
} from './exceptions';

export interface HttpClientOptions {
  apiKey?: string;
  proUsername?: string;
  proPassword?: string;
  baseUrl?: string;
  maxRetries?: number;
  backoffFactor?: number;
}

export class HttpClient {
  public readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly authHeader?: string;
  private readonly maxRetries: number;
  private readonly backoffFactor: number;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'https://api.metatraderapi.dev').replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.maxRetries = options.maxRetries ?? 3;
    this.backoffFactor = options.backoffFactor ?? 0.5;

    if (options.proUsername && options.proPassword) {
      if (typeof btoa !== 'undefined') {
        this.authHeader = `Basic ${btoa(`${options.proUsername}:${options.proPassword}`)}`;
      } else if (typeof Buffer !== 'undefined') {
        this.authHeader = `Basic ${Buffer.from(`${options.proUsername}:${options.proPassword}`).toString('base64')}`;
      }
    }
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async request<T>(method: string, endpoint: string, queryParams: Record<string, any> = {}, body?: any): Promise<T> {
    let url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (this.apiKey) {
      url.searchParams.append('api_key', this.apiKey);
    }
    
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (this.authHeader) {
      headers['Authorization'] = this.authHeader;
    }

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        const text = await response.text();
        let data: any;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { text };
        }

        if (response.ok) {
          return data as T;
        }

        // Error Handling
        if (response.status === 401) {
          throw new AuthenticationError();
        } else if (response.status === 404) {
          throw new AccountNotFoundError(queryParams['id'] || 'unknown', data);
        } else if (response.status === 429) {
          const retryAfterStr = response.headers.get('Retry-After');
          const retryAfter = retryAfterStr ? parseInt(retryAfterStr, 10) : undefined;
          
          if (attempt < this.maxRetries) {
            const delay = retryAfter ? retryAfter * 1000 : (this.backoffFactor * Math.pow(2, attempt)) * 1000;
            await this.sleep(delay);
            attempt++;
            continue;
          }
          throw new RateLimitError(retryAfter, data);
        } else if (response.status >= 500) {
          if (attempt < this.maxRetries) {
            await this.sleep((this.backoffFactor * Math.pow(2, attempt)) * 1000);
            attempt++;
            continue;
          }
          throw new ServerError(`Server error: ${response.status}`, response.status, data);
        }

        throw new Api2TradeError(`HTTP ${response.status}: ${JSON.stringify(data)}`, response.status, data);

      } catch (error: any) {
        if (error instanceof Api2TradeError) {
          throw error;
        }
        // Network errors
        if (attempt < this.maxRetries) {
          await this.sleep((this.backoffFactor * Math.pow(2, attempt)) * 1000);
          attempt++;
          continue;
        }
        throw new Api2TradeError(`Network error: ${error.message}`);
      }
    }
    
    throw new Api2TradeError('Max retries exceeded');
  }

  public get<T>(endpoint: string, params?: Record<string, any>) {
    return this.request<T>('GET', endpoint, params);
  }

  public post<T>(endpoint: string, params?: Record<string, any>, body?: any) {
    return this.request<T>('POST', endpoint, params, body);
  }

  public delete<T>(endpoint: string, params?: Record<string, any>, body?: any) {
    return this.request<T>('DELETE', endpoint, params, body);
  }
}
