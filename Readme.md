# MetaKeep Transaction Telemetry

A comprehensive web3 transaction management system with real-time telemetry and analytics.

## 🌟 Features

- **Transaction Link Generator**: Create shareable transaction links for smart contract interactions
- **Real-time Analytics**: Monitor page views and transaction metrics
- **Multi-chain Support**: Compatible with multiple EVM networks (Sepolia, Ethereum, Polygon, etc.)
- **Web3 Integration**: Seamless integration with MetaMask and other Web3 wallets
- **DynamoDB Backend**: Scalable serverless architecture for telemetry data

## 🏗 Architecture

### Frontend (React + Vite)
- **React 18**: Modern UI with functional components and hooks
- **Vite**: Lightning-fast build tool and development server
- **TypeScript**: Type-safe development environment
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Web3.js**: Ethereum JavaScript API for blockchain interactions
- **React Router**: Client-side routing
- **React Hot Toast**: User-friendly notifications
- **Recharts**: Interactive analytics charts
- **Lucide React**: Modern icon set

### Backend (Serverless)
- **AWS Lambda**: Serverless compute
- **DynamoDB**: NoSQL database for telemetry data
- **API Gateway**: RESTful API endpoints
- **TypeScript**: Type-safe Lambda functions
- **Serverless Framework**: Infrastructure as code

## 📐 System Design

### Transaction Flow
1. Developer generates a transaction link with contract details
2. User receives the link and opens it in their browser
3. Web3 wallet prompts for connection and network switch if needed
4. Transaction is executed on the blockchain
5. Telemetry data is recorded in DynamoDB

### Telemetry System
- Records page views in real-time
- Aggregates data per minute for efficient querying
- Provides real-time analytics dashboard
- Uses DynamoDB's atomic counters for accurate metrics

## 🔧 Technical Implementation

### Smart Contract Integration
- Dynamic ABI parsing and validation
- Function parameter type checking
- Network switching support
- Transaction status tracking

### Data Storage
- DynamoDB single-table design
- Optimized for time-series data
- Efficient querying patterns
- Atomic counters for concurrent updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- AWS Account
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
cd backend && npm install
```

3. Configure AWS credentials:
```bash
# Create .env file in backend directory
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

4. Deploy backend:
```bash
npm run deploy:backend
```

5. Start development server:
```bash
npm run dev
```

## 📦 Project Structure

```
.
├── src/
│   ├── components/         # React components
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   └── App.tsx            # Main application
├── backend/
│   ├── src/
│   │   └── handlers/      # Lambda functions
│   └── serverless.yml     # Serverless configuration
└── package.json           # Project dependencies
```

## 🔐 Security Considerations

- Row-level security in DynamoDB
- CORS configuration for API endpoints
- Environment variable management
- Web3 wallet security best practices

## 📈 Performance Optimizations

- Efficient DynamoDB query patterns
- React component optimization
- Network request caching
- Minimal bundle size

## 🧪 Testing

- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for transaction flow
- Performance monitoring

