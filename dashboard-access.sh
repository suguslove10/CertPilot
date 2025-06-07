#!/bin/bash

# Script to securely access the Traefik dashboard from a production server
# Usage: ./dashboard-access.sh <remote_user> <remote_host>

if [ $# -lt 2 ]; then
  echo "Usage: $0 <remote_user> <remote_host>"
  echo "Example: $0 ubuntu 123.45.67.89"
  exit 1
fi

REMOTE_USER=$1
REMOTE_HOST=$2
LOCAL_PORT=8090
REMOTE_PORT=8090

echo "Setting up secure SSH tunnel to Traefik dashboard on $REMOTE_HOST..."
echo "Once connected, access the dashboard at: http://localhost:$LOCAL_PORT/dashboard/"
echo "Press Ctrl+C to close the tunnel when finished."
echo

# Test SSH connection first
echo "Testing SSH connection..."
if ssh -q -o BatchMode=yes -o ConnectTimeout=5 $REMOTE_USER@$REMOTE_HOST exit; then
  echo "SSH connection successful. Setting up tunnel..."
else
  echo "ERROR: Cannot establish SSH connection to $REMOTE_USER@$REMOTE_HOST"
  echo 
  echo "Troubleshooting:"
  echo "1. Verify your SSH key is properly set up:"
  echo "   - Check if you have an SSH key: ls -la ~/.ssh/"
  echo "   - If you don't have a key, create one: ssh-keygen -t rsa -b 4096"
  echo 
  echo "2. Make sure your public key is added to the server:"
  echo "   - Copy your key to the server: ssh-copy-id $REMOTE_USER@$REMOTE_HOST"
  echo "   - Or manually add your public key to: ~/.ssh/authorized_keys on the server"
  echo
  echo "3. Alternatively, access the dashboard directly in your browser:"
  echo "   http://$REMOTE_HOST:$REMOTE_PORT/dashboard/"
  echo
  exit 1
fi

# Create SSH tunnel to securely access the dashboard
ssh -L $LOCAL_PORT:localhost:$REMOTE_PORT $REMOTE_USER@$REMOTE_HOST

# This script creates a secure SSH tunnel that forwards your local port 8090
# to the remote server's localhost:8090, allowing you to securely access
# the Traefik dashboard without exposing it to the public internet. 