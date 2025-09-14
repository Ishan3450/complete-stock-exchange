# **Exchange Project**

This project is a simplified implementation of an **order-matching exchange system**, inspired by stock/crypto trading platforms. It demonstrates how orders are placed, matched, and managed within an exchange environment.

## **Features**

- **Order Management** – Place, cancel, and track buy/sell orders
- **Order Book** – Maintains separate books for bids (buyers) and asks (sellers)
- **Matching Engine** – Matches buy and sell orders based on price-time priority
- **Trade Execution** – Executes trades when matching conditions are met
- **User Balances** – Ensures sufficient balance before order placement
- **Open Orders & Trade History** – View pending orders and executed trades

## **Table of Contents**

- [**Exchange Project**](#exchange-project)
  - [**Features**](#features)
  - [**Table of Contents**](#table-of-contents)
  - [**Architecture**](#architecture)
  - [**Demo**](#demo)
  - [**Project Structure (Monorepo structure)**](#project-structure-monorepo-structure)
  - [**Technologies Used**](#technologies-used)
  - [**Installation**](#installation)
    - [To Setup DB:](#to-setup-db)
    - [**Packages Installation**](#packages-installation)
  - [**Usage**](#usage)
    - [**Accessing the Application**](#accessing-the-application)
  - [**Reach Out**](#reach-out)

## **Architecture**

<img width="2765" height="1481" alt="Exchange Project Architecture" src="https://github.com/user-attachments/assets/1643d300-b5b4-41c6-a511-715b18aa1b9a" />

## **Demo**

https://github.com/user-attachments/assets/a4f96f8f-bd86-4871-b862-dee34eec984e

## **Project Structure (Monorepo structure)**

```plaintext
./
│
├── apps/
│   │
│   ├── api/              # API Gateway/Layer
│   ├── db/               # Database service and access logic
│   ├── engine/           # Core matching engine and business logic
│   ├── market_makers/    # Market maker simulation and automation
│   ├── ui/               # Frontend
│   └── ws/               # Websocket gateway/services
│
└── packages/
    │
    ├── eslint-config/      # Common ESLint config shared by all apps
    ├── jest-config/        # Shared Jest test config
    ├── shared-types/       # Shared TypeScript types/interfaces
    └── typescript-config/  # Shared TSConfig/base tsconfig
```

## **Technologies Used**

- **redis** – In-memory data store for caching, pub/sub messaging, and real-time exchange updates.
- **timescale db** – Postgres extension for OHLCV data generation.
- **uuid** – Generates unique IDs.
- **express** – Main backend web framework, handles API routing, middleware, and server logic.
- **pg** – PostgreSQL driver for Node.js, manages database connections for trades, orders, and users.
- **axios** – Makes HTTP requests to external APIs, services, or for internal communication.
- **lightweight-charts** – Provides fast, interactive candlestick/OHLCV charting for market data visualization.
- **lucide-react** – Icon library for UI elements in React.
- **next** – Frontend framework for dynamic dashboards, SSR, and trading interfaces.
- **tailwindcss** – Utility-first CSS framework for rapid and consistent frontend styling.
- **shadcn components** – Accessible, React components for UI design and interactions.
- **ws** – WebSocket library for handling real-time client-server communication.
- **jest** – JavaScript/TypeScript test runner for writing and running tests.
- **typescript** – Adds static typing, aiding in reliable development and maintainability.

## **Installation**

### To Setup DB:

```sql
CREATE DATABASE exchange_db;

\c exchange_db

CREATE EXTENSION IF NOT EXISTS timescaledb;
```

### **Packages Installation**

- In the root folder run the command:

```bash
npm install
```

> This will install the the dependencies of the system.

## **Usage**

- In the root folder run the command:

```bash
npm run dev
```

> This will start the system locally

### **Accessing the Application**

- Ports and URLs in: `packages/shared-types/src/portsAndUrl.ts`

## **Reach Out**

For any inquiries or feedback, feel free to reach out.

- LinkedIn: [Ishan Jagani](https://www.linkedin.com/in/ishanjagani/)
