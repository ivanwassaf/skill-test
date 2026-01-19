#!/bin/bash

###############################################################################
# PostgreSQL Backup Script
# Creates timestamped backups of the school management database
###############################################################################

set -e

# Configuration
DB_NAME="${POSTGRES_DB:-school_mgmt}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}PostgreSQL Backup Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Database: ${DB_NAME}"
echo -e "Host: ${DB_HOST}:${DB_PORT}"
echo -e "Backup file: ${COMPRESSED_FILE}"
echo -e "${YELLOW}========================================${NC}"

# Check if PostgreSQL is accessible
echo -e "\n${YELLOW}[1/5]${NC} Checking database connection..."
if ! PGPASSWORD="${POSTGRES_PASSWORD}" pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: Cannot connect to PostgreSQL at ${DB_HOST}:${DB_PORT}${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database is accessible${NC}"

# Create backup
echo -e "\n${YELLOW}[2/5]${NC} Creating backup..."
if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --verbose \
    --format=plain \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    > "${BACKUP_FILE}" 2>&1 | grep -v "^pg_dump:"; then
    echo -e "${GREEN}✓ Backup created successfully${NC}"
else
    echo -e "${RED}✗ Error creating backup${NC}"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Compress backup
echo -e "\n${YELLOW}[3/5]${NC} Compressing backup..."
if gzip -f "${BACKUP_FILE}"; then
    ORIGINAL_SIZE=$(stat -f%z "${COMPRESSED_FILE}" 2>/dev/null || stat -c%s "${COMPRESSED_FILE}" 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ Backup compressed (Size: ${ORIGINAL_SIZE} bytes)${NC}"
else
    echo -e "${RED}✗ Error compressing backup${NC}"
    exit 1
fi

# Verify backup
echo -e "\n${YELLOW}[4/5]${NC} Verifying backup integrity..."
if gzip -t "${COMPRESSED_FILE}" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup integrity verified${NC}"
else
    echo -e "${RED}✗ Backup file is corrupted${NC}"
    exit 1
fi

# Clean up old backups
echo -e "\n${YELLOW}[5/5]${NC} Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
DELETED_COUNT=0
if [ -d "${BACKUP_DIR}" ]; then
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((DELETED_COUNT++))
    done < <(find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)
fi

if [ ${DELETED_COUNT} -gt 0 ]; then
    echo -e "${GREEN}✓ Deleted ${DELETED_COUNT} old backup(s)${NC}"
else
    echo -e "${GREEN}✓ No old backups to delete${NC}"
fi

# Summary
TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" -type f 2>/dev/null | wc -l | tr -d ' ')
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backup file: ${COMPRESSED_FILE}"
echo -e "Total backups: ${TOTAL_BACKUPS}"
echo -e "Latest backup: $(ls -t ${BACKUP_DIR}/backup_${DB_NAME}_*.sql.gz 2>/dev/null | head -1)"
echo -e "${GREEN}========================================${NC}"

exit 0
