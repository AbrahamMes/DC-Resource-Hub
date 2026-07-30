#!/bin/sh
set -eu

if [ ! -f "${SITES_CONFIG_PATH}" ]; then
  echo "Site configuration not found: ${SITES_CONFIG_PATH}" >&2
  echo "Mount a sites.json file at that path (see config/sites.example.json)." >&2
  exit 1
fi

mkdir -p "${DATA_DIR}" "${BACKUP_DIR}"

if [ ! -w "${DATA_DIR}" ]; then
  echo "DATA_DIR is not writable: ${DATA_DIR}" >&2
  exit 1
fi

if [ ! -w "${BACKUP_DIR}" ]; then
  echo "BACKUP_DIR is not writable: ${BACKUP_DIR}" >&2
  exit 1
fi

npm run site:validate -- --config "${SITES_CONFIG_PATH}" --initialize

exec "$@"
