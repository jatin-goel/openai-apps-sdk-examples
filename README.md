# Chat2Checkout

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Razorpay](https://img.shields.io/badge/Razorpay-Integrated-0C60D0?logo=razorpay&logoColor=white)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**AI-powered conversational checkout experience with Razorpay payment integration**

[Features](#-features) • [Quick Start](#-quick-start) • [Deployment](#-deploy-to-railway) • [Architecture](#-architecture) • [API Reference](#-api-endpoints)

</div>

---

## 📖 Overview

Chat2Checkout lets you build your own ChatGPT e-commerce app using the Model Context Protocol (MCP). Connect your online store and enable customers to browse products, manage carts, and complete purchases through natural conversation. Currently integrates with Razorpay webstores, with Shopify support coming soon. Built on the [OpenAI Apps SDK](https://developers.openai.com/apps-sdk).

## ✨ Features

| Feature                  | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| 🔌 **MCP Protocol**      | Full Model Context Protocol implementation for AI integration |
| 🛍️ **Product Catalog**   | Browse and search products from connected stores              |
| 🛒 **Cart Management**   | Add, remove, and update cart items conversationally           |
| 💳 **Magic Checkout**    | One-click Razorpay payment integration                        |
| 🎨 **Rich Widgets**      | Beautiful React-based UI components                           |
| 📱 **Responsive Design** | Works seamlessly across devices                               |
| 🔐 **Secure Payments**   | Production-ready Razorpay integration                         |

## 🏗️ Architecture

```
chat2checkout/
├── razorpay_server_node/     # MCP Server (Node.js/TypeScript)
│   ├── src/
│   │   ├── config/           # Configuration & environment
│   │   ├── mcp/              # MCP server & widget definitions
│   │   ├── routes/           # HTTP request handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # CORS, etc.
│   │   ├── types/            # TypeScript definitions
│   │   └── server.ts         # Main entry point
│   └── docs/                 # API documentation
│
├── widgets/                  # UI Components (React/Vite)
│   ├── product-list-widget/  # Product listing & cart widget
│   │   ├── src/              # React components
│   │   └── assets/           # Built bundles
│   └── shared/               # Shared utilities & hooks
│
└── package.json              # Root workspace config
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** (recommended) or npm/yarn
- **Razorpay Account** ([Sign up](https://dashboard.razorpay.com/signup))

### Installation

```bash
# Clone the repository
git clone https://github.com/razorpay/chat2checkout.git
cd chat2checkout

# Install all dependencies
pnpm install

# Navigate to server directory and install
cd razorpay_server_node
pnpm install
```

### Environment Setup

Create a `.env` file in the `razorpay_server_node/` directory:

```bash
# Server Configuration
PORT=8000

# Razorpay API Keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx        # Required for payments

# Base URL for widget assets (production only)
BASE_URL=https://your-domain.com
```

### Running Locally

**Terminal 1 - Build & Serve Widgets:**

```bash
cd widgets
pnpm run build    # Build widget assets
pnpm run serve    # Serve on http://localhost:4444
```

**Terminal 2 - Start MCP Server:**

```bash
cd razorpay_server_node
pnpm run dev      # Development mode with hot-reload
# or
pnpm start        # Production mode
```

The server will start on `http://localhost:8000`.

## 🚂 Deploy to Railway

[Railway](https://railway.app) provides instant deployments with zero configuration. Here's how to deploy Chat2Checkout:

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### Manual Deployment

#### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub for seamless deployments

#### Step 2: Create New Project

1. Click **"New Project"** in your Railway dashboard
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account and select the `chat2checkout` repository

#### Step 3: Configure Services

You'll need to create **two services**:

**Service 1: Widget Server**

```yaml
Name: widgets
Root Directory: widgets
Build Command: pnpm install && pnpm run build
Start Command: pnpm run serve
```

**Service 2: MCP Server**

```yaml
Name: mcp-server
Root Directory: razorpay_server_node
Build Command: pnpm install
Start Command: pnpm start
```

#### Step 4: Set Environment Variables

In Railway dashboard, go to your MCP server service → **Variables** tab:

| Variable          | Description                                   | Required |
| ----------------- | --------------------------------------------- | -------- |
| `PORT`            | Server port (Railway sets this automatically) | Auto     |
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID                          | ✅ Yes   |
| `BASE_URL`        | Your Railway widget server URL                | ✅ Yes   |

```bash
# Example environment variables
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
BASE_URL=https://widgets-production-xxxx.up.railway.app
```

#### Step 5: Configure Networking

1. Go to each service → **Settings** → **Networking**
2. Click **"Generate Domain"** for public access
3. Note the generated URLs:
   - Widget Server: `https://widgets-xxxx.up.railway.app`
   - MCP Server: `https://mcp-server-xxxx.up.railway.app`

#### Step 6: Update BASE_URL

Update the `BASE_URL` environment variable with your widget server's Railway URL.

### Railway Configuration File (Optional)

Create `railway.json` in project root for advanced configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Verify Deployment

Test your deployment:

```bash
# Health check
curl https://your-mcp-server.up.railway.app/mcp

# Test store parsing
curl "https://your-mcp-server.up.railway.app/api/razorpay/parse-store?url=YOUR_STORE_URL"
```

## 🔗 Connect to ChatGPT

Once deployed, connect your MCP server to ChatGPT:

1. Enable [Developer Mode](https://platform.openai.com/docs/guides/developer-mode) in ChatGPT
2. Go to **Settings** → **Connectors**
3. Add your MCP endpoint: `https://your-mcp-server.up.railway.app/mcp`
4. Start a conversation and select your connector

**Example prompts:**

- "Show me products from the store"
- "Add the blue t-shirt to my cart"
- "Proceed to checkout"

## 📚 API Endpoints

### MCP Endpoints

| Method | Endpoint        | Description                     |
| ------ | --------------- | ------------------------------- |
| `GET`  | `/mcp`          | SSE connection for MCP protocol |
| `POST` | `/mcp/messages` | MCP message handling            |

### Razorpay Integration

| Method     | Endpoint                            | Description                  |
| ---------- | ----------------------------------- | ---------------------------- |
| `GET`      | `/api/razorpay/parse-store?url=...` | Parse Razorpay store catalog |
| `POST`     | `/api/razorpay/create-order`        | Create payment order         |
| `POST`     | `/api/razorpay/verify-payment`      | Verify payment signature     |
| `GET/POST` | `/api/razorpay/magic-checkout`      | Magic Checkout integration   |

## 🛠️ Development

### Widget Development

```bash
cd widgets
pnpm run dev      # Start Vite dev server with HMR
```

### Server Development

```bash
cd razorpay_server_node
pnpm run dev      # Start with watch mode
```

### Build for Production

```bash
# Build widgets
cd widgets && pnpm run build

# The server uses tsx for TypeScript execution
cd razorpay_server_node && pnpm start
```

## 🧪 Testing

```bash
# Test MCP endpoint
curl http://localhost:8000/mcp

# Test store parsing
curl "http://localhost:8000/api/razorpay/parse-store?url=https://your-store.razorpay.com"

# Test order creation
curl -X POST http://localhost:8000/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "INR"}'
```

## 🔐 Security Considerations

- **Never commit `.env` files** with real API keys
- Use **test mode keys** (`rzp_test_*`) during development
- Enable **webhook verification** for production

## 📖 Additional Documentation

- [Razorpay Server Docs](./razorpay_server_node/docs/README.md)
- [Architecture Guide](./razorpay_server_node/docs/ARCHITECTURE.md)
- [Magic Checkout API](./razorpay_server_node/docs/MAGIC_CHECKOUT_API.md)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Open a [GitHub Issue](https://github.com/razorpay/chat2checkout/issues)
- **Razorpay Support**: [Razorpay Documentation](https://razorpay.com/docs/)
