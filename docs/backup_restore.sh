#!/bin/bash

# Configuration
POSTGRES_CONTAINER_NAME="erp-postgres" # Match docker-compose container name
DB_USER="postgres"
BACKUP_DIR="./backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

DATABASES=("erp_auth" "erp_academic" "erp_finance" "erp_hr")

backup() {
    echo "=== Starting PostgreSQL Databases Backup ==="
    for db in "${DATABASES[@]}"; do
        echo "Backing up database: $db..."
        docker exec -t "$POSTGRES_CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$db" --clean > "$BACKUP_DIR/${db}_backup.sql"
        if [ $? -eq 0 ]; then
            echo "Success: Saved to $BACKUP_DIR/${db}_backup.sql"
        else
            echo "Error: Backup failed for $db"
        fi
    done
    echo "=== Backup Process Completed ==="
}

restore() {
    echo "=== Starting PostgreSQL Databases Restore ==="
    for db in "${DATABASES[@]}"; do
        backup_file="$BACKUP_DIR/${db}_backup.sql"
        if [ -f "$backup_file" ]; then
            echo "Restoring database: $db from $backup_file..."
            # Drop and recreate database is clean with --clean in pg_dump, 
            # but we write to container's psql
            docker exec -i "$POSTGRES_CONTAINER_NAME" psql -U "$DB_USER" -d "$db" < "$backup_file"
            if [ $? -eq 0 ]; then
                echo "Success: Restored $db"
            else
                echo "Error: Restore failed for $db"
            fi
        else
            echo "Warning: Backup file not found at $backup_file, skipping restore for $db"
        fi
    done
    echo "=== Restore Process Completed ==="
}

usage() {
    echo "Usage: $0 [backup|restore]"
    exit 1
}

if [ "$1" == "backup" ]; then
    backup
elif [ "$1" == "restore" ]; then
    restore
else
    usage
fi
