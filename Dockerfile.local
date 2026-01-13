FROM c.rzp.io/razorpay/rzp-docker-image-inventory-multi-arch:rzp-golden-image-base-node-20-alpine3.21 AS builder

# Install git
RUN apk add --no-cache git

WORKDIR /app

# Add build arg for git token
ARG GIT_TOKEN
ENV GIT_TOKEN=${GIT_TOKEN}

RUN git config --global url."https://x-access-token:${GIT_TOKEN}@github.com/".insteadOf "https://github.com/"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

FROM c.rzp.io/razorpay/rzp-docker-image-inventory-multi-arch:rzp-golden-image-base-node-20-alpine3.21

RUN apk --no-cache add ca-certificates

# Create a non-root user to run the application
RUN addgroup -S rzpgroup && adduser -S rzp -G rzpgroup

WORKDIR /app

# Copy node_modules and application from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Change ownership of the application to the non-root user
RUN chown -R rzp:rzpgroup /app

ENV NODE_ENV=production \
    PORT="8090" \
    MODE="sse" \
    ADDRESS="chat2checkout.razorpay.com"

# Switch to the non-root user
USER rzp

# Expose the application port
EXPOSE ${PORT}

# Start the application with tsx (no build step needed)
CMD ["npx", "tsx", "src/server.ts"]
