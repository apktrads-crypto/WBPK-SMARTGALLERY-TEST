FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for Prisma & Sharp
RUN apk add --no-cache openssl python3 make g++ 

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# Final stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/.env* ./

EXPOSE 5000

CMD ["npm", "start"]
