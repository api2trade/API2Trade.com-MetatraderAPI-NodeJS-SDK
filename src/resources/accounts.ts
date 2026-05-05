import { HttpClient } from '../http';
import { ConnectStatus, RegisteredAccount, AccountSummary } from '../types';

export class AccountsResource {
  constructor(private http: HttpClient) {}

  public async register(login: string, password: string, server: string): Promise<string> {
    const data = await this.registerFull(login, password, server);
    return data.id;
  }

  public async registerFull(login: string, password: string, server: string): Promise<RegisteredAccount> {
    return this.http.post<RegisteredAccount>('/RegisterAccount', {}, { login: String(login), password, server });
  }

  public async checkConnect(accountId: string): Promise<ConnectStatus> {
    return this.http.get<ConnectStatus>('/CheckConnect', { id: accountId });
  }

  public async summary(accountId: string): Promise<AccountSummary> {
    return this.http.get<AccountSummary>('/AccountSummary', { id: accountId });
  }

  public async delete(accountId: string): Promise<boolean> {
    await this.http.delete('/DeleteAccount', {}, { id: accountId });
    return true;
  }
}
