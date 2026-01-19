#!/bin/bash

###############################################################################
# PostgreSQL Recovery Script
# Restores database from a backup file
###############################################################################

set -e

# Configuration
DB_NAME="${POSTGRES_DB:-school_mgmt}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="$1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Usage function
usage() {
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Example:"
    echo "  $0 ./backups/backup_school_mgmt_20260119_120000.sql.gz"
    echo ""
    echo "Available backups:"
    ls -lt "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | head -5 || echo "  No backups found"
    exit 1
}

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: No backup file specified${NC}\n"
    usage
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}\n"
    usage
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}PostgreSQL Recovery Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Database: ${DB_NAME}"
echo -e "Host: ${DB_HOST}:${DB_PORT}"
echo -e "Backup file: ${BACKUP_FILE}"
echo -e "${YELLOW}========================================${NC}"

# Warning message
echo -e "\n${RED}WARNING: This will drop the existing database and restore from backup!${NC}"
echo -e "${RED}All current data will be lost!${NC}\n"
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "\n${YELLOW}Recovery cancelled${NC}"
    exit 0
fi

# Check database connection
echo -e "\n${YELLOW}[1/6]${NC} Checking database connection..."
if ! PGPASSWORD="${POSTGRES_PASSWORD}" pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: Cannot connect to PostgreSQL at ${DB_HOST}:${DB_PORT}${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database is accessible${NC}"

# Verify backup integrity
echo -e "\n${YELLOW}[2/6]${NC} Verifying backup integrity..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
        echo -e "${RED}✗ Backup file is corrupted${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Backup file is valid${NC}"

# Create temporary directory for restoration
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

# Extract backup if compressed
echo -e "\n${YELLOW}[3/6]${NC} Extracting backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    SQL_FILE="${TEMP_DIR}/restore.sql"
    gunzip -c "$BACKUP_FILE" > "$SQL_FILE"
else
    SQL_FILE="$BACKUP_FILE"
fi
echo -e "${GREEN}✓ Backup extracted${NC}"

# Create backup of current database before restoration
echo -e "\n${YELLOW}[4/6]${NC} Creating safety backup of current database..."
SAFETY_BACKUP="${BACKUP_DIR}/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=plain \
    --clean \
    --if-exists \
    | gzip > "$SAFETY_BACKUP" 2>&1; then
    echo -e "${GREEN}✓ Safety backup created: ${SAFETY_BACKUP}${NC}"
else
    echo -e "${YELLOW}⚠ Could not create safety backup (continuing anyway)${NC}"
fi

# Terminate active connections
echo -e "\n${YELLOW}[5/6]${NC} Terminating active connections..."
PGPASSWORD="${POSTGRES_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1
echo -e "${GREEN}✓ Active connections terminated${NC}"

# Restore database
echo -e "\n${YELLOW}[6/6]${NC} Restoring database from backup..."
if PGPASSWORD="${POSTGRES_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    < "$SQL_FILE" 2>&1 | grep -v "^ERROR:" | grep -v "^NOTICE:"; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}✗ Error restoring database${NC}"
    echo -e "${YELLOW}You can try to restore manually from: ${SAFETY_BACKUP}${NC}"
    exit 1
fi

# Verify restoration
echo -e "\n${YELLOW}Verifying restoration...${NC}"
TABLE_COUNT=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Recovery completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Database: ${DB_NAME}"
echo -e "Tables restored: ${TABLE_COUNT}"
echo -e "Safety backup: ${SAFETY_BACKUP}"
echo -e "${GREEN}========================================${NC}"

exit 0
