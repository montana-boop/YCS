# Discord MCP server — remote HTTP transport.
# Builds the TypeScript sources and runs the Streamable HTTP entry point.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# DISCORD_BOT_TOKEN and MCP_AUTH_TOKEN must be provided at runtime.
# PORT defaults to 3000; most hosts inject their own PORT env var.
EXPOSE 3000
CMD ["node", "dist/http.js"]
