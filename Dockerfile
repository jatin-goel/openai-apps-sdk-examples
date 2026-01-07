FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app


# Copy razorpay_server_node and install dependencies
COPY razorpay_server_node/package.json razorpay_server_node/pnpm-lock.yaml ./razorpay_server_node/
RUN cd razorpay_server_node && pnpm install --frozen-lockfile

COPY razorpay_server_node/ ./razorpay_server_node/

WORKDIR /app/razorpay_server_node



# Copy widgets and install/build
COPY widgets/package.json widgets/pnpm-lock.yaml ./widgets/
RUN cd widgets && pnpm install --frozen-lockfile

COPY widgets/ ./widgets/
RUN cd widgets && pnpm run build

EXPOSE 8000

CMD ["pnpm", "exec", "tsx", "src/server.ts"]

