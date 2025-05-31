#!/bin/bash

# Build and start the digital wallet system

echo "Setting up DigiWallet system..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Create test users
echo "Creating test users..."
npm run setup

# Start the server
echo "Starting DigiWallet server..."
npm run dev
