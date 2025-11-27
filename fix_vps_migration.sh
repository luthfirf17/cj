#!/bin/bash

echo "🔍 Checking database tables..."
docker-compose exec -T postgres psql -U postgres -d catat_jasamu_db -c "\dt"

echo ""
echo "🔍 Checking service_responsible_parties table..."
docker-compose exec -T postgres psql -U postgres -d catat_jasamu_db -c "SELECT COUNT(*) FROM service_responsible_parties;"

echo ""
echo "🔍 Checking migration files..."
ls -la backend/migrations/

echo ""
echo "🚀 Running pending migrations..."
cd backend && node migrations/run_migration.js

echo ""
echo "✅ Migration completed. Verifying tables..."
docker-compose exec -T postgres psql -U postgres -d catat_jasamu_db -c "\dt"

echo ""
echo "✅ Checking service_responsible_parties table after migration..."
docker-compose exec -T postgres psql -U postgres -d catat_jasamu_db -c "SELECT COUNT(*) FROM service_responsible_parties;"

echo ""
echo "🔄 Restarting backend container..."
docker-compose restart backend

echo ""
echo "✅ Update completed! Test the application at https://catatjasamu.com"