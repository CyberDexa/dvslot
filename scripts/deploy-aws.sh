#!/bin/bash
# DVSlot Production Deployment Script for AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}
STACK_NAME="dvslot-$ENVIRONMENT"
DOMAIN_NAME=${3:-api.dvslot.com}
DB_PASSWORD=${4:-$(openssl rand -base64 32)}

echo -e "${GREEN}🚀 DVSlot AWS Deployment Starting...${NC}"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack: $STACK_NAME"
echo "Domain: $DOMAIN_NAME"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check if logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with AWS. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Create ECR repositories if they don't exist
echo -e "${YELLOW}📦 Setting up ECR repositories...${NC}"

ECR_REPO_API="dvslot/api"
ECR_REPO_SCRAPER="dvslot/scraper"

for repo in $ECR_REPO_API $ECR_REPO_SCRAPER; do
    if ! aws ecr describe-repositories --repository-names $repo --region $REGION &> /dev/null; then
        echo "Creating ECR repository: $repo"
        aws ecr create-repository --repository-name $repo --region $REGION
    else
        echo "ECR repository $repo already exists"
    fi
done

# Get ECR login token
echo -e "${YELLOW}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com

# Build and push Docker images
echo -e "${YELLOW}🔨 Building and pushing Docker images...${NC}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build API image
echo "Building API image..."
docker build -t $ECR_REPO_API:latest -f Dockerfile .
docker tag $ECR_REPO_API:latest $ECR_REGISTRY/$ECR_REPO_API:latest
docker push $ECR_REGISTRY/$ECR_REPO_API:latest

# Build scraper image
echo "Building Scraper image..."
docker build -t $ECR_REPO_SCRAPER:latest -f scrapers/Dockerfile scrapers/
docker tag $ECR_REPO_SCRAPER:latest $ECR_REGISTRY/$ECR_REPO_SCRAPER:latest
docker push $ECR_REGISTRY/$ECR_REPO_SCRAPER:latest

echo -e "${GREEN}✅ Docker images pushed to ECR${NC}"

# Request SSL certificate if it doesn't exist
echo -e "${YELLOW}🔒 Setting up SSL certificate...${NC}"

CERT_ARN=$(aws acm list-certificates --region $REGION --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" --output text)

if [ -z "$CERT_ARN" ]; then
    echo "Requesting SSL certificate for $DOMAIN_NAME"
    CERT_ARN=$(aws acm request-certificate \
        --domain-name $DOMAIN_NAME \
        --validation-method DNS \
        --region $REGION \
        --query CertificateArn --output text)
    
    echo -e "${YELLOW}⏳ SSL certificate requested. You need to validate it via DNS before proceeding.${NC}"
    echo "Certificate ARN: $CERT_ARN"
    echo "Please add the DNS validation records to your domain and wait for validation."
    read -p "Press Enter when SSL certificate is validated..."
else
    echo "Using existing SSL certificate: $CERT_ARN"
fi

# Deploy CloudFormation stack
echo -e "${YELLOW}☁️  Deploying CloudFormation stack...${NC}"

aws cloudformation deploy \
    --template-file infrastructure/aws-cloudformation.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        DomainName=$DOMAIN_NAME \
        CertificateArn=$CERT_ARN \
        DBPassword=$DB_PASSWORD \
    --capabilities CAPABILITY_IAM \
    --region $REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFormation stack deployed successfully${NC}"
else
    echo -e "${RED}❌ CloudFormation deployment failed${NC}"
    exit 1
fi

# Get stack outputs
echo -e "${YELLOW}📋 Getting stack outputs...${NC}"

ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" \
    --output text)

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" \
    --output text)

REDIS_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query "Stacks[0].Outputs[?OutputKey=='RedisEndpoint'].OutputValue" \
    --output text)

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"

# First, we need to connect to the database through the ECS task
# This requires the ECS service to be running

# Wait for ECS service to be stable
echo "Waiting for ECS service to stabilize..."
aws ecs wait services-stable \
    --cluster $ENVIRONMENT-dvslot-cluster \
    --services $ENVIRONMENT-dvslot-api \
    --region $REGION

# Run migrations through ECS task
TASK_DEFINITION_ARN=$(aws ecs describe-services \
    --cluster $ENVIRONMENT-dvslot-cluster \
    --services $ENVIRONMENT-dvslot-api \
    --region $REGION \
    --query "services[0].taskDefinition" \
    --output text)

echo "Running database migrations..."
aws ecs run-task \
    --cluster $ENVIRONMENT-dvslot-cluster \
    --task-definition $TASK_DEFINITION_ARN \
    --overrides '{
        "containerOverrides": [{
            "name": "api",
            "command": ["npm", "run", "migrate:prod"]
        }]
    }' \
    --launch-type FARGATE \
    --network-configuration '{
        "awsvpcConfiguration": {
            "subnets": ["'$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query "Stacks[0].Outputs[?OutputKey=='"'"'PrivateSubnet1'"'"'].OutputValue" --output text)'"],
            "securityGroups": ["'$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query "Stacks[0].Outputs[?OutputKey=='"'"'ECSSecurityGroup'"'"'].OutputValue" --output text)'"],
            "assignPublicIp": "ENABLED"
        }
    }' \
    --region $REGION

echo -e "${GREEN}✅ Database migrations initiated${NC}"

# Setup monitoring and alerts
echo -e "${YELLOW}📊 Setting up CloudWatch monitoring...${NC}"

# Create CloudWatch dashboard
cat > dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${STACK_NAME}-dvslot-alb" ],
                    [ ".", "TargetResponseTime", ".", "." ],
                    [ ".", "HTTPCode_Target_4XX_Count", ".", "." ],
                    [ ".", "HTTPCode_Target_5XX_Count", ".", "." ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "$REGION",
                "title": "Application Load Balancer Metrics"
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", "ServiceName", "$ENVIRONMENT-dvslot-api", "ClusterName", "$ENVIRONMENT-dvslot-cluster" ],
                    [ ".", "MemoryUtilization", ".", ".", ".", "." ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "$REGION",
                "title": "ECS Service Metrics"
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "$ENVIRONMENT-dvslot-db" ],
                    [ ".", "DatabaseConnections", ".", "." ],
                    [ ".", "ReadLatency", ".", "." ],
                    [ ".", "WriteLatency", ".", "." ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "$REGION",
                "title": "RDS Database Metrics"
            }
        }
    ]
}
EOF

aws cloudwatch put-dashboard \
    --dashboard-name "DVSlot-$ENVIRONMENT" \
    --dashboard-body file://dashboard.json \
    --region $REGION

rm dashboard.json

echo -e "${GREEN}✅ CloudWatch dashboard created${NC}"

# Create DNS record (if Route53 is being used)
if aws route53 list-hosted-zones --query "HostedZones[?contains(Name, '$(echo $DOMAIN_NAME | cut -d. -f2-)')].Id" --output text | grep -q "/hostedzone/"; then
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?contains(Name, '$(echo $DOMAIN_NAME | cut -d. -f2-)')].Id" --output text | sed 's|/hostedzone/||')
    
    echo -e "${YELLOW}🌐 Creating DNS record...${NC}"
    
    cat > dns-record.json << EOF
{
    "Changes": [{
        "Action": "UPSERT",
        "ResourceRecordSet": {
            "Name": "$DOMAIN_NAME",
            "Type": "A",
            "AliasTarget": {
                "DNSName": "$ALB_DNS",
                "EvaluateTargetHealth": true,
                "HostedZoneId": "Z35SXDOTRQ7X7K"
            }
        }
    }]
}
EOF
    
    aws route53 change-resource-record-sets \
        --hosted-zone-id $HOSTED_ZONE_ID \
        --change-batch file://dns-record.json
    
    rm dns-record.json
    echo -e "${GREEN}✅ DNS record created${NC}"
fi

# Final status check
echo -e "${YELLOW}🔍 Performing health check...${NC}"

sleep 30  # Wait for services to fully start

if curl -f -s "https://$DOMAIN_NAME/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed. Services may still be starting up.${NC}"
fi

echo -e "${GREEN}"
echo "🎉 DVSlot deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Domain: https://$DOMAIN_NAME"
echo "   Load Balancer: $ALB_DNS"
echo "   Database: $DB_ENDPOINT"
echo "   Redis: $REDIS_ENDPOINT"
echo ""
echo "🔐 Database Password: $DB_PASSWORD"
echo "   (Store this securely!)"
echo ""
echo "📊 CloudWatch Dashboard:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=DVSlot-$ENVIRONMENT"
echo ""
echo "🔧 Next Steps:"
echo "   1. Verify all services are running"
echo "   2. Test the API endpoints"
echo "   3. Set up monitoring alerts"
echo "   4. Configure backup strategies"
echo "   5. Update mobile app with production API URL"
echo -e "${NC}"
