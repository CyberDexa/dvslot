#!/bin/bash

# DVSlot Development Helper Script
# Collection of useful commands for development workflow

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}🚗 DVSlot Development Helper${NC}"
    echo "============================="
}

show_help() {
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Available commands:"
    echo "  start         Start all development services"
    echo "  stop          Stop all services"
    echo "  restart       Restart all services"
    echo "  logs          Show live logs from all services"
    echo "  logs [service] Show logs from specific service"
    echo "  shell         Open shell in API container"
    echo "  db            Connect to PostgreSQL database"
    echo "  redis         Connect to Redis CLI"
    echo "  test          Run test suite"
    echo "  lint          Run code linting"
    echo "  clean         Clean up containers and volumes"
    echo "  reset         Reset database (drop and recreate)"
    echo "  seed          Seed test data"
    echo "  migrate       Run database migrations"
    echo "  build         Build all Docker images"
    echo "  status        Show service status"
    echo "  health        Check service health"
    echo ""
}

start_services() {
    echo -e "${GREEN}Starting development services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Services started successfully${NC}"
    show_status
}

stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}Services stopped${NC}"
}

restart_services() {
    echo -e "${YELLOW}Restarting services...${NC}"
    docker-compose restart
    echo -e "${GREEN}Services restarted${NC}"
    show_status
}

show_logs() {
    if [ -n "$1" ]; then
        echo -e "${BLUE}Showing logs for service: $1${NC}"
        docker-compose logs -f "$1"
    else
        echo -e "${BLUE}Showing logs for all services${NC}"
        docker-compose logs -f
    fi
}

open_shell() {
    echo -e "${BLUE}Opening shell in API container...${NC}"
    docker-compose exec api /bin/bash
}

connect_db() {
    echo -e "${BLUE}Connecting to PostgreSQL database...${NC}"
    docker-compose exec postgres psql -U dvslot -d dvslot
}

connect_redis() {
    echo -e "${BLUE}Connecting to Redis CLI...${NC}"
    docker-compose exec redis redis-cli
}

run_tests() {
    echo -e "${BLUE}Running test suite...${NC}"
    docker-compose exec api npm test
}

run_lint() {
    echo -e "${BLUE}Running code linting...${NC}"
    docker-compose exec api npm run lint
}

clean_up() {
    echo -e "${YELLOW}Cleaning up containers and volumes...${NC}"
    read -p "This will remove all containers, networks, and volumes. Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --remove-orphans
        docker system prune -f
        echo -e "${GREEN}Cleanup completed${NC}"
    else
        echo -e "${YELLOW}Cleanup cancelled${NC}"
    fi
}

reset_database() {
    echo -e "${YELLOW}Resetting database...${NC}"
    read -p "This will drop all data and recreate the database. Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS dvslot;"
        docker-compose exec postgres psql -U postgres -c "CREATE DATABASE dvslot OWNER dvslot;"
        docker-compose exec api npm run migrate
        echo -e "${GREEN}Database reset completed${NC}"
    else
        echo -e "${YELLOW}Database reset cancelled${NC}"
    fi
}

seed_data() {
    echo -e "${BLUE}Seeding test data...${NC}"
    docker-compose exec api npm run seed
    echo -e "${GREEN}Test data seeded${NC}"
}

run_migrations() {
    echo -e "${BLUE}Running database migrations...${NC}"
    docker-compose exec api npm run migrate
    echo -e "${GREEN}Migrations completed${NC}"
}

build_images() {
    echo -e "${BLUE}Building Docker images...${NC}"
    docker-compose build
    echo -e "${GREEN}Build completed${NC}"
}

show_status() {
    echo -e "${BLUE}Service Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo "🌐 API: http://localhost:8080"
    echo "🏥 Health: http://localhost:8080/health"
    echo "🗄️ PostgreSQL: localhost:5432"
    echo "🗂️ Redis: localhost:6379"
    echo "📨 RabbitMQ Management: http://localhost:15672"
}

check_health() {
    echo -e "${BLUE}Checking service health...${NC}"
    
    # Check API health
    if curl -s http://localhost:8080/health > /dev/null; then
        echo -e "${GREEN}✅ API is healthy${NC}"
    else
        echo -e "${RED}❌ API is not responding${NC}"
    fi
    
    # Check database connection
    if docker-compose exec -T postgres pg_isready -U dvslot -d dvslot > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is healthy${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not ready${NC}"
    fi
    
    # Check Redis connection
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is healthy${NC}"
    else
        echo -e "${RED}❌ Redis is not responding${NC}"
    fi
    
    # Check RabbitMQ
    if curl -s http://localhost:15672 > /dev/null; then
        echo -e "${GREEN}✅ RabbitMQ is healthy${NC}"
    else
        echo -e "${RED}❌ RabbitMQ is not responding${NC}"
    fi
}

# Main script logic
print_header

case "${1:-help}" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs "$2"
        ;;
    "shell")
        open_shell
        ;;
    "db")
        connect_db
        ;;
    "redis")
        connect_redis
        ;;
    "test")
        run_tests
        ;;
    "lint")
        run_lint
        ;;
    "clean")
        clean_up
        ;;
    "reset")
        reset_database
        ;;
    "seed")
        seed_data
        ;;
    "migrate")
        run_migrations
        ;;
    "build")
        build_images
        ;;
    "status")
        show_status
        ;;
    "health")
        check_health
        ;;
    "help"|*)
        show_help
        ;;
esac
