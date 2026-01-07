FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@10.24.0

WORKDIR /app

# Copy widgets and install/build
COPY widgets/package.json widgets/pnpm-lock.yaml ./widgets/
RUN cd widgets && pnpm install 

COPY widgets/ ./widgets/
RUN cd widgets && pnpm run build

# Copy razorpay_server_node and install dependencies
COPY razorpay_server_node/package.json razorpay_server_node/pnpm-lock.yaml ./razorpay_server_node/
RUN cd razorpay_server_node && pnpm install 

COPY razorpay_server_node/ ./razorpay_server_node/

WORKDIR /app/razorpay_server_node


# print env
CMD ["env"]

EXPOSE 8000

CMD ["pnpm", "exec", "tsx", "src/server.ts"]

