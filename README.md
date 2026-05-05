# API2Trade JavaScript / TypeScript SDK

> **Official JS/TS SDK for the <a href="https://api2trade.com" rel="dofollow">API2Trade</a> Metatrader API.**  
> A robust **API for Metatrader** that lets you control your trading accounts programmatically from Node.js or the browser.  
> Build integrations, trading bots, and dashboards using this high-performance **MT4 API** and **MT5 API** — no MetaTrader terminal required.

[![npm version](https://img.shields.io/npm/v/api2trade-sdk.svg)](https://www.npmjs.com/package/api2trade-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)
[![API Status](https://img.shields.io/badge/API_Status-99.95%25_Uptime-brightgreen)](https://status.metatraderapi.dev/)
[![Docs](https://img.shields.io/badge/Docs-docs.metatraderapi.dev-informational)](https://docs.metatraderapi.dev/docs)

---

## Installation

```bash
# Using npm
npm install api2trade-sdk

# Using yarn
yarn add api2trade-sdk

# Using pnpm
pnpm add api2trade-sdk
```

---

## 60-Second Quickstart

```typescript
import { Api2TradeClient, OrderType } from 'api2trade-sdk';

// Initialize with your API key from app.metatraderapi.dev
const client = new Api2TradeClient({ apiKey: 'YOUR_API_KEY' });

async function run() {
  // 1. Register your MT4/MT5 account
  const accountId = await client.accounts.register(
    '123456', 
    'BrokerPass', 
    'ICMarkets-Live01'
  );
  console.log(`Account UUID: ${accountId}`); // save this!

  // 2. Check live balance
  const summary = await client.accounts.summary(accountId);
  console.log(`Balance: ${summary.balance} ${summary.currency}`);
  console.log(`Equity:  ${summary.equity} ${summary.currency}`);

  // 3. Get a live quote
  const quote = await client.market.quote(accountId, 'EURUSD');
  console.log(`Ask: ${quote.ask}, Bid: ${quote.bid}`);

  // 4. Place a trade
  const result = await client.orders.send(
    accountId,
    'EURUSD',
    OrderType.BUY_MARKET,
    0.01,
    Number((quote.ask - 0.0020).toFixed(5)), // Stop Loss
    Number((quote.ask + 0.0040).toFixed(5))  // Take Profit
  );
  console.log(`Ticket: ${result.ticket}`);

  // 5. Close the trade
  await client.orders.close(accountId, result.ticket);
}

run().catch(console.error);
```

---

## Configuration via Environment Variables

The SDK automatically picks up these environment variables if available in Node.js (e.g. via `dotenv`):

```bash
API2TRADE_API_KEY=sk-...
API2TRADE_BASE_URL=https://api.metatraderapi.dev    # optional
API2TRADE_WS_URL=wss://api.metatraderapi.dev/stream # optional
```

```typescript
import { Api2TradeClient } from 'api2trade-sdk';
// Automatically uses process.env.API2TRADE_API_KEY
const client = new Api2TradeClient(); 
```

---

## WebSocket Streaming

Receive real-time market data directly from the broker using our low-latency streaming client.

```typescript
import { Api2TradeClient } from 'api2trade-sdk';

const client = new Api2TradeClient({ apiKey: 'YOUR_API_KEY' });

client.stream(
  'YOUR_ACCOUNT_ID',
  ['EURUSD', 'XAUUSD'],
  (tick) => {
    // Fired on every price update
    console.log(`${tick.symbol}: ${tick.bid} / ${tick.ask}`);
  },
  (error) => {
    console.error('Stream error:', error);
  },
  () => {
    console.log('Connected to stream!');
  }
);
```

---

## Error Handling

The SDK provides specific, typed errors for common API rejections:

```typescript
import { 
  Api2TradeClient, 
  BrokerRejectionError, 
  AuthenticationError 
} from 'api2trade-sdk';

const client = new Api2TradeClient();

try {
  await client.orders.send(accountId, 'EURUSD', 0, 0.01);
} catch (error) {
  if (error instanceof BrokerRejectionError) {
    console.log(`Broker rejected trade (Code: ${error.retcode}): ${error.comment}`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key.');
  } else {
    console.error('Unknown API error:', error);
  }
}
```

---

## Support

| Channel | Link |
|---------|------|
| 📧 Email | [support@api2trade.com](mailto:support@api2trade.com) |
| 💬 Telegram | [t.me/apisupport_en](https://t.me/apisupport_en) |
| 📖 Docs | [docs.metatraderapi.dev](https://docs.metatraderapi.dev/docs) |
| 🌐 Website | [api2trade.com](https://www.api2trade.com/) |

---

## License

MIT — see [LICENSE](LICENSE).

---

*MetaTrader®, MT4®, and MT5® are trademarks of MetaQuotes Ltd. API2Trade is an independent service and is not affiliated with MetaQuotes Ltd.*
