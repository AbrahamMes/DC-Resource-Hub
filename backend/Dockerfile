FROM node:22.17.1-bookworm-slim AS dependencies

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22.17.1-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3001 \
    DATA_DIR=/app/data \
    SITES_CONFIG_PATH=/app/config/sites.json \
    BACKUP_DIR=/app/backups \
    WEB_CONCURRENCY=1

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src
COPY scripts ./scripts
COPY config/sites.example.json ./config/sites.example.json
COPY setup-check.js ./setup-check.js
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /app/data /app/config /app/backups \
    && chown -R node:node /app/data /app/backups \
    && chmod 755 /usr/local/bin/docker-entrypoint.sh

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
