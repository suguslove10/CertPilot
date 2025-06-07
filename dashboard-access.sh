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

# Create SSH tunnel to securely access the dashboard
ssh -L $LOCAL_PORT:localhost:$REMOTE_PORT $REMOTE_USER@$REMOTE_HOST

# This script creates a secure SSH tunnel that forwards your local port 8090
# to the remote server's localhost:8090, allowing you to securely access
# the Traefik dashboard without exposing it to the public internet. 