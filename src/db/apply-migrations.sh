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

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}Error: Missing NEXT_PUBLIC_SUPABASE_URL in .env.local${NC}"
    exit 1
fi

if [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${RED}Error: Missing SUPABASE_DB_URL in .env.local${NC}"
    echo
    echo "Add this variable to .env.local (from Supabase Project Settings -> Database -> Connection string):"
    echo "  SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
    echo
    echo "Note: URL must include sslmode=require"
    exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
    echo -e "${RED}Error: 'psql' is not installed${NC}"
    echo "Install PostgreSQL client tools first:"
    echo "  brew install libpq"
    echo "  brew link --force libpq"
    exit 1
fi

echo -e "${YELLOW}Supabase Project URL:${NC} $NEXT_PUBLIC_SUPABASE_URL"
echo -e "${YELLOW}Applying migrations to database...${NC}\n"

# Function to run SQL migration
run_migration() {
    local migration_file=$1
    local file_path="./src/db/migrations/$migration_file"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}❌ Migration file not found: $file_path${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Applying: $migration_file${NC}"

    # Execute SQL file directly against Supabase Postgres.
    if psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$file_path" >/tmp/cau0nong_migration.log 2>&1; then
        echo -e "${GREEN}✓ Applied: $migration_file${NC}"
    else
        echo -e "${RED}❌ Failed: $migration_file${NC}"
        echo "----- psql output -----"
        cat /tmp/cau0nong_migration.log
        echo "-----------------------"
        return 1
    fi

    echo
    return 0
}

# Apply migrations in order
MIGRATIONS=(
    "001_initial_schema.sql"
    "002_add_payer_offset_and_event_link.sql"
    "004_add_session_status.sql"
    "005_add_username_and_approval_status.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    run_migration "$migration" || exit 1
done

echo -e "${GREEN}✓ All migrations applied successfully${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Run: npm run db:seed (to populate test data)"
echo "2. Test API endpoints: npm run dev"
echo "3. Check dashboard at http://localhost:3000"
