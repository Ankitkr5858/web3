# Web3 Project Architecture Documentation

## Project Structure

```
./
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── UserView.tsx    # MetaKeep wallet integration
│   │   ├── DeveloperView.tsx # Contract interaction UI
│   │   └── TelemetryDashboard.tsx # Analytics display
│   ├── utils/             # Utility functions
│   │   ├── contract.ts    # Smart contract helpers
│   │   └── metakeep.ts    # MetaKeep SDK wrapper
│   ├── types/             # TypeScript type definitions
│   └── App.tsx            # Main application component
├── backend/               # Serverless backend
│   ├── src/
│   │   └── handlers/      # Lambda functions
│   └── serverless.yml     # AWS configuration
└── public/                # Static assets

```

## Implementation Details

### Frontend Components

1. **UserView (UserView.tsx)**
   - Implements MetaKeep SDK initialization and wallet connection
   - Handles network switching to Sepolia testnet
   - Manages transaction state and error handling
   - Implements retry logic for failed connections
   - Uses React hooks for state management

2. **DeveloperView (DeveloperView.tsx)**
   - Implements contract ABI parsing and validation
   - Provides form generation for contract functions
   - Manages contract address validation
   - Implements transaction parameter encoding
   - Handles test network configuration

3. **TelemetryDashboard (TelemetryDashboard.tsx)**
   - Implements real-time data visualization
   - Manages API integration with backend
   - Handles data aggregation and filtering
   - Implements responsive design patterns

### Utility Functions

1. **Contract Utilities (contract.ts)**
   ```typescript
   // Contract interaction helpers
   interface ContractConfig {
     address: string;
     abi: string;
     functionName: string;
     params?: any[];
   }

   // Transaction execution wrapper
   async function executeTransaction(config: ContractConfig): Promise<string>
   ```

2. **MetaKeep Integration (metakeep.ts)**
   ```typescript
   // SDK initialization
   class MetaKeepSDKProvider {
     constructor(appId: string);
     initialize(): Promise<void>;
     connect(): Promise<WalletInfo>;
     switchNetwork(chainId: number): Promise<void>;
   }
   ```

### Backend Implementation

1. **Telemetry Functions**
   ```typescript
   // Page view recording
   async function recordPageView(event: APIGatewayEvent): Promise<APIGatewayProxyResult>

   // Analytics data retrieval
   async function getPageViews(event: APIGatewayEvent): Promise<APIGatewayProxyResult>
   ```

2. **Database Schema**
   ```typescript
   interface TelemetryRecord {
     timestamp: number;
     userId: string;
     action: string;
     metadata: Record<string, any>;
   }
   ```

## Configuration

### Environment Variables

1. **Frontend (.env)**
   ```
   VITE_API_URL=https://api.example.com
   VITE_METAKEEP_APP_ID=your_app_id
   VITE_SEPOLIA_RPC=https://sepolia.infura.io/v3/your_key
   ```

2. **Backend (.env)**
   ```
   DYNAMODB_TABLE=telemetry-table
   AWS_REGION=us-east-1
   STAGE=development
   ```

### Build Configuration

1. **Vite Config (vite.config.ts)**
   ```typescript
   export default defineConfig({
     plugins: [react()],
     build: {
       sourcemap: true,
       minify: 'terser'
     }
   })
   ```

2. **Serverless Config (serverless.yml)**
   ```yaml
   service: web3-backend
   provider:
     name: aws
     runtime: nodejs18.x
     region: us-east-1
   ```

## Development Workflow

### Frontend Development

1. **Component Development**
   ```bash
   # Start development server
   npm run dev

   # Run tests
   npm test

   # Build for production
   npm run build
   ```

2. **Testing Strategy**
   ```typescript
   // Component testing example
   describe('UserView', () => {
     it('handles wallet connection', async () => {
       render(<UserView />);
       // Test implementation
     });
   });
   ```

### Backend Development

1. **Local Testing**
   ```bash
   # Install dependencies
   cd backend && npm install

   # Run local server
   serverless offline

   # Deploy to AWS
   serverless deploy
   ```

2. **API Testing**
   ```typescript
   // Lambda function test
   describe('recordPageView', () => {
     it('records telemetry data', async () => {
       const result = await handler(event);
       expect(result.statusCode).toBe(200);
     });
   });
   ```

## Overview
This project is a comprehensive web3 application that facilitates interaction with smart contracts through MetaKeep wallet integration. It consists of a React-based frontend and a serverless backend architecture for telemetry data collection.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript and consists of three main components:

1. **UserView Component**
   - Handles MetaKeep wallet integration
   - Manages transaction execution flow
   - Implements network switching (Sepolia)
   - Provides transaction status feedback
   - Handles error states and user notifications

2. **DeveloperView Component**
   - Provides interface for contract ABI interaction
   - Manages saved contracts
   - Implements balance checking functionality
   - Generates transaction links
   - Handles test addresses and networks

3. **TelemetryDashboard Component**
   - Displays usage analytics
   - Visualizes transaction data
   - Monitors user interactions

### Backend Architecture
The backend uses a serverless architecture deployed on AWS Lambda:

```
backend/
├── src/
│   └── handlers/      # Lambda functions
└── serverless.yml     # Serverless configuration
```

- **Lambda Functions**:
  - `recordPageView`: Records user page visits
  - `getPageViews`: Retrieves analytics data

### Integration Patterns

1. **MetaKeep Integration**
   - Wallet connection management
   - Transaction signing
   - Network switching capabilities
   - Error handling and retry logic

2. **Smart Contract Interaction**
   - ABI parsing and validation
   - Function parameter handling
   - Transaction execution
   - Balance checking

## Data Flow

1. **Transaction Flow**
   ```
   User Input → MetaKeep SDK → Smart Contract → Transaction Execution → Status Update
   ```

2. **Telemetry Flow**
   ```
   User Action → Frontend Event → Lambda Function → Database → Dashboard
   ```

## Development Setup

1. **Prerequisites**
   - Node.js
   - AWS CLI configured
   - MetaKeep App ID

2. **Environment Configuration**
   - Set up `.env` with:
     - `VITE_API_URL`
     - `VITE_METAKEEP_APP_ID`

3. **Local Development**
   ```bash
   npm install
   npm run dev
   ```

4. **Backend Development**
   ```bash
   cd backend
   npm install
   serverless deploy
   ```

## Security Considerations

1. **Frontend Security**
   - Network validation
   - Transaction parameter validation
   - Error handling

2. **Backend Security**
   - API Gateway authentication
   - Rate limiting
   - Input validation

## Testing Strategy

1. **Frontend Tests**
   - Component testing
   - Integration testing
   - MetaKeep SDK mocking

2. **Backend Tests**
   - Lambda function testing
   - API endpoint testing

## Deployment

1. **Frontend Deployment**
   - Build optimization
   - Asset management
   - Environment configuration

2. **Backend Deployment**
   - Serverless framework
   - AWS Lambda configuration
   - API Gateway setup

## Monitoring and Maintenance

1. **Frontend Monitoring**
   - Error tracking
   - Performance monitoring
   - User interaction analytics

2. **Backend Monitoring**
   - Lambda function metrics
   - API Gateway metrics
   - Error logging

## Future Considerations

1. **Scalability**
   - Frontend caching strategies
   - Backend service optimization
   - Database scaling

2. **Feature Roadmap**
   - Additional wallet integrations
   - Enhanced analytics
   - Smart contract templates