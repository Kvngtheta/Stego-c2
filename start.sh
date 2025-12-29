#!/bin/bash

echo "=========================================="
echo "  StegoTransfer Server Startup"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting server..."
echo ""
echo "Access points:"
echo "  Main Webapp:  http://localhost:3000"
echo "  Admin Panel:  http://localhost:3000/admin"
echo ""
echo "Watch the console output for admin credentials!"
echo ""
echo "=========================================="
echo ""

node server.js
