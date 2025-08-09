#!/bin/bash

# Production Deployment Script for DVSlot
# This script deploys DVSlot to a production environment

set -e

echo "🚀 DVSlot Production Deployment"
echo "==============================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate environment
validate_environment() {
    print_step "Validating production environment..."
    
    # Check required environment variables
    required_vars=(
        "NODE_ENV"
        "DB_HOST"
        "DB_PASSWORD"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "FIREBASE_PROJECT_ID"
        "FIREBASE_PRIVATE_KEY"
        "EMAIL_HOST"
        "EMAIL_PASSWORD"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -ne 0 ]]; then
        print_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    if [[ "$NODE_ENV" != "production" ]]; then
        print_error "NODE_ENV must be set to 'production'"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Build application
build_application() {
    print_step "Building application..."
    
    # Install production dependencies
    npm ci --only=production
    
    # Build TypeScript
    npm run build
    
    print_success "Application built successfully"
}

# Run database migrations
run_migrations() {
    print_step "Running database migrations..."
    
    # Wait for database to be ready
    until pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER"; do
        echo "Waiting for database to be ready..."
        sleep 2
    done
    
    # Run migrations
    npm run migrate
    
    print_success "Database migrations completed"
}

# Start services with Docker Compose
deploy_services() {
    print_step "Deploying services..."
    
    # Pull latest images
    docker-compose pull
    
    # Build and start services
    docker-compose up -d --build
    
    # Wait for services to be healthy
    print_step "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if curl -f http://localhost:8080/health; then
        print_success "Services are healthy and running"
    else
        print_error "Health check failed"
        docker-compose logs api
        exit 1
    fi
}

# Setup SSL/TLS (if not using a load balancer)
setup_ssl() {
    if [[ -n "$DOMAIN_NAME" ]] && [[ ! -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]]; then
        print_step "Setting up SSL certificate..."
        
        # Install certbot if not present
        if ! command -v certbot &> /dev/null; then
            print_warning "Certbot not found. Please install certbot for SSL setup."
            return 1
        fi
        
        # Obtain SSL certificate
        certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos -m "$SSL_EMAIL"
        
        print_success "SSL certificate obtained"
    fi
}

# Setup monitoring (basic)
setup_monitoring() {
    print_step "Setting up basic monitoring..."
    
    # Create monitoring script
    cat > /usr/local/bin/dvslot-health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:8080/health"
LOG_FILE="/var/log/dvslot-health.log"

if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo "$(date): Health check passed" >> "$LOG_FILE"
else
    echo "$(date): Health check failed" >> "$LOG_FILE"
    # Send alert (implement your alerting here)
fi
EOF

    chmod +x /usr/local/bin/dvslot-health-check.sh
    
    # Add to crontab (check every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/dvslot-health-check.sh") | crontab -
    
    print_success "Basic monitoring setup completed"
}

# Backup database
backup_database() {
    print_step "Creating database backup..."
    
    BACKUP_DIR="/opt/dvslot/backups"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/dvslot_$(date +%Y%m%d_%H%M%S).sql"
    
    pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
    
    print_success "Database backup created: ${BACKUP_FILE}.gz"
}

# Setup log rotation
setup_log_rotation() {
    print_step "Setting up log rotation..."
    
    cat > /etc/logrotate.d/dvslot << 'EOF'
/opt/dvslot/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 dvslot dvslot
    postrotate
        docker-compose restart api > /dev/null 2>&1 || true
    endscript
}
EOF
    
    print_success "Log rotation configured"
}

# Performance optimizations
optimize_performance() {
    print_step "Applying performance optimizations..."
    
    # Set Node.js production optimizations
    export NODE_OPTIONS="--max-old-space-size=2048"
    
    # Configure PostgreSQL for production (basic)
    if [[ -w "/var/lib/postgresql/data/postgresql.conf" ]]; then
        cat >> /var/lib/postgresql/data/postgresql.conf << 'EOF'
# DVSlot production optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.7
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
EOF
    fi
    
    print_success "Performance optimizations applied"
}

# Main deployment function
main() {
    print_step "Starting DVSlot production deployment..."
    
    # Parse command line arguments
    SKIP_BUILD=false
    SKIP_MIGRATIONS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-migrations)
                SKIP_MIGRATIONS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [--skip-build] [--skip-migrations]"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Validate environment
    validate_environment
    
    # Create backup before deployment
    backup_database
    
    # Build application (unless skipped)
    if [[ "$SKIP_BUILD" != true ]]; then
        build_application
    fi
    
    # Run migrations (unless skipped)
    if [[ "$SKIP_MIGRATIONS" != true ]]; then
        run_migrations
    fi
    
    # Deploy services
    deploy_services
    
    # Setup SSL (optional)
    setup_ssl
    
    # Setup monitoring
    setup_monitoring
    
    # Setup log rotation
    setup_log_rotation
    
    # Apply performance optimizations
    optimize_performance
    
    print_success "🎉 DVSlot deployment completed successfully!"
    
    echo ""
    echo "🌐 Your DVSlot API is now running at:"
    echo "   Health Check: http://localhost:8080/health"
    echo "   API Base URL: http://localhost:8080/api/v1"
    echo ""
    echo "📊 Monitoring:"
    echo "   Logs: docker-compose logs -f"
    echo "   Status: docker-compose ps"
    echo "   Health: /usr/local/bin/dvslot-health-check.sh"
    echo ""
    echo "🔧 Management commands:"
    echo "   Restart: docker-compose restart"
    echo "   Update: git pull && $0"
    echo "   Backup: run this script again (automatic backup)"
}

# Run main function
main "$@"
