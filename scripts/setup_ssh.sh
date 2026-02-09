#!/bin/bash

# Setup SSH key authentication for VPS

echo "Setting up SSH key authentication..."

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/cj_vps_key.pub root@srv1121305.hstgr.cloud << EOF
JasamuCatat321@
EOF

# Set correct permissions on VPS
ssh root@srv1121305.hstgr.cloud "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

echo "SSH key authentication setup complete!"
echo "You can now SSH without password: ssh -i ~/.ssh/cj_vps_key root@srv1121305.hstgr.cloud"