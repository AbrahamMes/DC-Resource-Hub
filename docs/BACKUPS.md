# Backups

The container-aware backup, restore, retention, disk-space, upgrade, and rollback procedures are maintained in [Docker deployment](DOCKER.md#backups-and-restore).

The backup command reads `DATA_DIR`, writes `BACKUP_DIR`, uses SQLite's online backup API for databases, copies all other mutable files, and creates a checksum manifest. Always verify a snapshot before depending on it.
