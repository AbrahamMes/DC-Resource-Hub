# SQLite deployment

Exactly one backend process and replica may access the mounted data volume. `WEB_CONCURRENCY=1` and the application guard enforce common process-manager settings, but the deployment platform must also keep the replica count at one and avoid overlapping replacements.

The supported Compose topology and the required migration path before horizontal scaling are documented in [Docker deployment](DOCKER.md#deployment-model).
