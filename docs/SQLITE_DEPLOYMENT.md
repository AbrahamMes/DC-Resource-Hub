# Single-instance SQLite deployment

The backend stores relational data in site-specific SQLite files and stores uploads on the local data volume. While that architecture is in use, production must run exactly one backend instance and one Node worker.

## Render configuration

The repository's `render.yaml` sets `numInstances: 1`, `WEB_CONCURRENCY=1`, and mounts one persistent data disk at `backend/data`. Deploy the backend from this Blueprint and leave autoscaling disabled. Render services with a persistent disk cannot be horizontally scaled; do not remove the disk merely to enable scaling.

After creating or updating the service, verify in the Render dashboard that:

- the instance count is `1`;
- autoscaling is disabled;
- the persistent disk is mounted at `/opt/render/project/src/backend/data`;
- the start command is `npm start`, without PM2 cluster mode or Node cluster workers.

The server also refuses to start when `WEB_CONCURRENCY` or common PM2/Node cluster variables indicate multiple workers. This protects against accidental multi-process startup on one host, but hosting instance count remains the deployment platform's responsibility.

## Other hosting platforms

Set the service replica, task, pod, dyno, or machine count to exactly one. Set `WEB_CONCURRENCY=1`, mount durable storage at `backend/data`, and disable horizontal autoscaling. Rolling deployments must not overlap old and new instances against the same writable SQLite volume. Stop the old instance before starting the replacement if the platform cannot guarantee single-writer attachment.

## When more capacity is required

Do not add backend replicas while any request reads or writes local SQLite databases or uploaded files. Before scaling horizontally:

1. Migrate the issues, assets, and commissioning schemas for every site to managed PostgreSQL.
2. Migrate schedules, contacts, drawings, spreadsheets, and other uploaded/configuration data to shared object storage.
3. Update the application so no runtime state depends on a backend's local filesystem.
4. Test concurrent writes, migrations, backups, and rollback with multiple backend instances.
5. Only then enable multiple replicas or autoscaling.
