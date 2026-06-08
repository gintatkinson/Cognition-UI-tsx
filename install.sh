#!/bin/bash
# Cognition-UI Firebase Standalone Installation Script
# Supports macOS (Brew) and Ubuntu/Debian

set -e

echo "Starting Cognition-UI Firebase Installation..."

# 1. Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v brew &> /dev/null; then
            echo "Homebrew is required on macOS. Please install it first."
            exit 1
        fi
        brew install node
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "Unsupported OS. Please install Node.js manually."
        exit 1
    fi
fi

# 2. Install Java (Required for Firebase Emulator)
if ! command -v java &> /dev/null; then
    echo "Java not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install openjdk
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y default-jre
    fi
fi

# 3. Install NPM Dependencies
echo "Installing project dependencies..."
npm install --legacy-peer-deps
npm install -D firebase-tools --legacy-peer-deps

# 4. Migrate Data to Local Emulator (One-time setup)
echo "Starting Firebase Emulator in the background for migration..."
npx firebase-tools emulators:start --only firestore &
EMULATOR_PID=$!

echo "Waiting 10 seconds for emulator to boot..."
sleep 10

echo "Running Data Migration Script..."
npx tsx migrate-to-firestore.ts

echo "Stopping Emulator..."
kill $EMULATOR_PID
wait $EMULATOR_PID 2>/dev/null || true

echo "Installation Complete!"
echo "To run the application locally:"
echo "1. Start the emulator: npx firebase-tools emulators:start --only firestore"
echo "2. In a new terminal, start the UI: npm run dev"
