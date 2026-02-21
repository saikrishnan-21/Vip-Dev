#!/bin/bash
# VIP-10706: Deployment Scripts
# Build script for production deployment

set -e

echo "🚀 VIPContentAI Build Script"
echo "=============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  Please update .env with production values!${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install --frozen-lockfile

# Run TypeScript type checking
echo -e "${YELLOW}Running TypeScript type check...${NC}"
pnpm run type-check || { echo -e "${RED}❌ Type check failed${NC}"; exit 1; }

# Run linter
echo -e "${YELLOW}Running linter...${NC}"
pnpm run lint || { echo -e "${RED}❌ Linting failed${NC}"; exit 1; }

# Build Next.js application
echo -e "${YELLOW}Building Next.js application...${NC}"
pnpm run build || { echo -e "${RED}❌ Build failed${NC}"; exit 1; }

# Build Python API service
echo -e "${YELLOW}Building Python API service...${NC}"
cd api-service
python -m pip install -r requirements.txt || { echo -e "${RED}❌ Python dependencies installation failed${NC}"; exit 1; }
cd ..

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Run database migrations: pnpm run db:migrate"
echo "2. Seed database (optional): pnpm run db:seed"
echo "3. Start production server: pnpm start"
