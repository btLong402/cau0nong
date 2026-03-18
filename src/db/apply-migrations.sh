#!/bin/bash

# Script to apply database migrations to Supabase
# Usage: ./apply-migrations.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}CLB Cầu Lông Database Migration Tool${NC}"
echo -e "${YELLOW}=====================================\n${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local not found${NC}"
    echo "Please create .env.local with Supabase credentials:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
    echo "  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>"
    exit 1
fi

source .env.local

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: Missing Supabase credentials in .env.local${NC}"
    exit 1
fi

echo -e "${YELLOW}Supabase Project URL:${NC} $NEXT_PUBLIC_SUPABASE_URL"
echo -e "${YELLOW}Applying migrations...${NC}\n"

# Function to run SQL migration
run_migration() {
    local migration_file=$1
    local file_path="./src/db/migrations/$migration_file"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}❌ Migration file not found: $file_path${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Applying: $migration_file${NC}"
    
    # Extract the SQL content from the file
    # This assumes you're using Supabase CLI or direct SQL execution
    # For now, we'll just display instructions
    
    echo -e "${GREEN}✓ Migration ready: $migration_file${NC}"
    echo "  → Copy the SQL from: $file_path"
    echo "  → Paste into Supabase Dashboard → SQL Editor"
    echo "  → Execute the migration"
    echo
    
    return 0
}

# Apply migrations in order
MIGRATIONS=(
    "001_initial_schema.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    run_migration "$migration"
done

echo -e "\n${YELLOW}Manual Step Required:${NC}"
echo "1. Go to https://app.supabase.com/project/<your-project-id>/sql"
echo "2. Create a new query"
echo "3. Copy the entire SQL from: src/db/migrations/001_initial_schema.sql"
echo "4. Execute the query"
echo "5. Verify all tables are created"
echo

echo -e "${GREEN}✓ Migration Instructions Complete${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Run: npm run db:seed (to populate test data)"
echo "2. Test API endpoints: npm run dev"
echo "3. Check dashboard at http://localhost:3000"
