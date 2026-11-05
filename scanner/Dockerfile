# ClamAV (official image: clamd + freshclam signature updates) plus the
# small Node.js HTTP wrapper in server.mjs. Needs about 2 GB of RAM because
# ClamAV keeps its signature database in memory.
FROM clamav/clamav:1.4

RUN apk add --no-cache nodejs tini

WORKDIR /app
COPY server.mjs start.sh ./
RUN chmod +x start.sh

ENV PORT=8080 CLAMD_HOST=127.0.0.1 CLAMD_PORT=3310
EXPOSE 8080

HEALTHCHECK --interval=60s --timeout=10s --start-period=300s \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/app/start.sh"]
