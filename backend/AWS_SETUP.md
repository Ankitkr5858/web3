# Setting up AWS Credentials for CI/CD

To fix the AWS credentials error in the GitHub Actions workflow, you need to set up AWS credentials as GitHub repository secrets. Follow these steps:

1. Create an AWS IAM User:
   - Go to AWS IAM Console
   - Create a new IAM user with programmatic access
   - Attach necessary permissions (e.g., `AWSLambdaFullAccess`, `IAMFullAccess`, `CloudFormationFullAccess`)
   - Save the Access Key ID and Secret Access Key

2. Add GitHub Repository Secrets:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Add the following secrets:
     - Name: `AWS_ACCESS_KEY_ID`
     - Value: Your AWS Access Key ID
   - Add another secret:
     - Name: `AWS_SECRET_ACCESS_KEY`
     - Value: Your AWS Secret Access Key

3. Verify Configuration:
   - The GitHub Actions workflow is already configured to use these secrets
   - After adding the secrets, re-run the failed workflow

Note: Never commit AWS credentials directly to your repository. Always use GitHub secrets for sensitive information.