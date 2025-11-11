#!/bin/bash

# =====================================================
# Database Backup Script - CatatJasamu
# =====================================================

# Database configuration
DB_NAME="catat_jasamu_db"
DB_USER="postgres"
BACKUP_DIR="./database_backups"
DATE=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Backup complete database (schema + data)
echo "📦 Backing up complete database (schema + data)..."
pg_dump -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_DIR/full_backup_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ Complete backup saved: $BACKUP_DIR/full_backup_$DATE.sql"
else
    echo "❌ Error creating complete backup"
    exit 1
fi

# 2. Backup only data (for restore to existing schema)
echo ""
echo "📊 Backing up data only..."
pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --inserts -f "$BACKUP_DIR/data_only_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ Data backup saved: $BACKUP_DIR/data_only_$DATE.sql"
else
    echo "❌ Error creating data backup"
fi

# 3. Backup only schema (structure without data)
echo ""
echo "🏗️  Backing up schema only..."
pg_dump -U "$DB_USER" -d "$DB_NAME" --schema-only -f "$BACKUP_DIR/schema_only_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ Schema backup saved: $BACKUP_DIR/schema_only_$DATE.sql"
else
    echo "❌ Error creating schema backup"
fi

# 4. Create compressed backup
echo ""
echo "🗜️  Creating compressed backup..."
pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_DIR/compressed_backup_$DATE.backup"

if [ $? -eq 0 ]; then
    echo "✅ Compressed backup saved: $BACKUP_DIR/compressed_backup_$DATE.backup"
else
    echo "❌ Error creating compressed backup"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup completed successfully!"
echo ""
echo "📁 Backup files location: $BACKUP_DIR"
echo ""
echo "To restore on new device:"
echo "  1. Full restore:       psql -U postgres -d catat_jasamu_db -f $BACKUP_DIR/full_backup_$DATE.sql"
echo "  2. Data only restore:  psql -U postgres -d catat_jasamu_db -f $BACKUP_DIR/data_only_$DATE.sql"
echo "  3. Compressed restore: pg_restore -U postgres -d catat_jasamu_db $BACKUP_DIR/compressed_backup_$DATE.backup"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
