#!/bin/bash

set -e

# Build widgets
cd widgets
pnpm install
pnpm run build

# Install razorpay_server_node dependencies
cd ../razorpay_server_node
pnpm install

echo "Build completed successfully!"

