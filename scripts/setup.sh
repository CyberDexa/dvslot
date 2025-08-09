#!/bin/bash

# DVSlot Setup Script
# This script helps set up the DVSlot application for development or production

set -e

echo "🚗 DVSlot Setup Script"
echo "======================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Check if Docker is installed
check_docker() {
    print_step "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed (for development)
check_node() {
    print_step "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. This is required for development mode."
        return 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        print_success "Node.js $NODE_VERSION is installed"
        return 0
    else
        print_warning "Node.js version $NODE_VERSION is installed, but version $REQUIRED_VERSION or higher is recommended"
        return 1
    fi
}

# Setup environment file
setup_env() {
    print_step "Setting up environment file..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from template"
            print_warning "Please edit .env file with your actual configuration values"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    else
        print_success ".env file already exists"
    fi
}

# Create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    
    directories=("logs" "uploads" "data/postgres" "data/redis")
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Created directory: $dir"
        fi
    done
}

# Install Node.js dependencies
install_dependencies() {
    if check_node; then
        print_step "Installing Node.js dependencies..."
        npm install
        print_success "Dependencies installed successfully"
    else
        print_warning "Skipping Node.js dependency installation (Node.js not available)"
    fi
}

# Build and start services
start_services() {
    print_step "Building and starting services..."
    
    # Build images
    docker-compose build
    
    # Start services in detached mode
    docker-compose up -d
    
    print_success "Services are starting up..."
    print_step "Waiting for services to be ready..."
    
    # Wait for database to be ready
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Services are running successfully"
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_step "Running database migrations..."
    
    # Wait a bit more for database to be fully ready
    sleep 5
    
    # Run migrations
    docker-compose exec api npm run migrate
    
    print_success "Database migrations completed"
}

# Seed test data (optional)
seed_data() {
    read -p "Would you like to seed test data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Seeding test data..."
        docker-compose exec api npm run seed
        print_success "Test data seeded successfully"
    fi
}

# Display service information
show_service_info() {
    print_step "Service Information"
    echo "==================="
    echo "🌐 API Server: http://localhost:8080"
    echo "🏥 Health Check: http://localhost:8080/health"
    echo "📚 API Docs: http://localhost:8080/api-docs (if enabled)"
    echo ""
    echo "Database Services:"
    echo "🗄️  PostgreSQL: localhost:5432"
    echo "🗂️  Redis: localhost:6379"
    echo "📨 RabbitMQ: http://localhost:15672 (guest/guest)"
    echo ""
    echo "Useful Commands:"
    echo "📊 View logs: docker-compose logs -f"
    echo "📈 Service status: docker-compose ps"
    echo "🛑 Stop services: docker-compose down"
    echo "🔄 Restart services: docker-compose restart"
}

# Main setup function
main() {
    echo "Choose setup mode:"
    echo "1) Development setup (with Node.js dependencies)"
    echo "2) Production setup (Docker only)"
    echo "3) Quick start (existing environment)"
    echo ""
    read -p "Enter your choice (1-3): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            print_step "Starting development setup..."
            check_docker
            check_node
            setup_env
            create_directories
            install_dependencies
            start_services
            run_migrations
            seed_data
            show_service_info
            ;;
        2)
            print_step "Starting production setup..."
            check_docker
            setup_env
            create_directories
            start_services
            run_migrations
            show_service_info
            ;;
        3)
            print_step "Quick start..."
            check_docker
            start_services
            show_service_info
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    print_success "Setup completed successfully! 🎉"
    print_step "Next Steps:"
    echo "1. Review and update your .env file with actual values"
    echo "2. Configure Firebase for push notifications"
    echo "3. Set up email service credentials"
    echo "4. Start developing or deploy to production"
}

# Run main function
main
