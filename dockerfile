# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./

# Install full dependencies because seed scripts use tsx (dev dependency)
RUN npm ci

# Copy built output and source files needed by seed scripts
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 3000
CMD ["sh", "-c", "npm run seed:all && node dist/index.js"]