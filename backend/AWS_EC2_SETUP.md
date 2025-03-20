# EC2 Deployment Guide

## Prerequisites

1. An AWS EC2 instance running Ubuntu
2. AWS IAM role with DynamoDB access attached to the EC2 instance
3. Security group with inbound rules:
   - TCP port 22 (SSH)
   - TCP port 3000 (Application)

## Deployment Steps

1. SSH into your EC2 instance:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. Clone the repository:
   ```bash
   git clone <repository-url>
   cd backend
   ```

3. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

4. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

## Environment Variables

The deployment script will create a `.env` file with the following variables:
- PORT=3000
- AWS_REGION=us-east-1
- DYNAMODB_TABLE=metakeep-transaction-telemetry-dev
- NODE_ENV=production

## Monitoring

- Application logs are stored in `error.log` and `combined.log`
- Use `pm2 status` to check the application status
- Use `pm2 logs` to view real-time logs

## Health Check

Test the deployment by accessing:
- Health endpoint: `http://your-ec2-ip:3000/health`
- Telemetry endpoints:
  - GET `http://your-ec2-ip:3000/telemetry/pageviews`
  - POST `http://your-ec2-ip:3000/telemetry/pageview`