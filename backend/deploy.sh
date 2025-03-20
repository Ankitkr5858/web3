#!/bin/bash

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally for process management
sudo npm install -g pm2

# Create environment file
cat > .env << EOL
PORT=3000
AWS_REGION=us-east-1
DYNAMODB_TABLE=metakeep-transaction-telemetry-dev
NODE_ENV=production
EOL

# Install dependencies
npm install

# Build the application
npm run build

# Start the server with PM2
pm2 start dist/server.js --name "metakeep-telemetry"

# Save PM2 process list and configure to start on system startup
pm2 save
pm2 startup

# Display status
pm2 status