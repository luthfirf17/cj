#!/bin/bash

# Script to fix backend Docker image on VPS
# Run this on your local machine

echo "=== Transferring Docker image to VPS ==="
echo "Make sure you're in the project root directory"

# Transfer the image
scp docker_backend.tar root@srv1121305.hstgr.cloud:~/cj/

echo "=== Now run these commands on your VPS ==="
echo ""
echo "cd ~/cj"
echo "docker load < docker_backend.tar"
echo "docker tag docker_backend:latest docker_backend"
echo "docker stop catatjasamu-backend-prod"
echo "docker rm catatjasamu-backend-prod"
echo "cd docker"
echo "docker run --rm --name debug-backend --env-file .env --network docker_catatjasamu-network-prod --link catatjasamu-postgres-prod:postgres -p 5001:5001 docker_backend"
echo ""
echo "=== If the debug run works, restart with docker-compose ==="
echo "docker-compose -f docker-compose.prod.yml up -d backend"