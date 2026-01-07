#!/bin/bash

set -e

# Enable corepack to use pnpm (specified in package.json packageManager field)
corepack enable

# Build widgets
cd widgets
pnpm install
pnpm run build

# Install razorpay_server_node dependencies
cd ../razorpay_server_node
pnpm install

echo "Build completed successfully!"
