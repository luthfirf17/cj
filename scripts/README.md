# 📜 Scripts Directory

Folder ini berisi utility scripts untuk berbagai keperluan project.

## 📂 Structure

```
scripts/
├── backup/              # Database & data backup scripts
│   ├── backup-data-nodejs.js
│   ├── backup-database.sh
│   └── backup-database.bat
├── restore/             # Data restore scripts
│   └── restore-files.sh
└── docker/              # Docker setup scripts
    └── docker-setup.sh
```

## 🔧 Scripts Overview

### Backup Scripts (`backup/`)

#### `backup-data-nodejs.js`
Backup database dan data aplikasi dalam format JSON.

```bash
# Run from backend directory
cd backend
node ../scripts/backup/backup-data-nodejs.js
```

#### `backup-database.sh` (Linux/Mac)
Shell script untuk backup database PostgreSQL.

```bash
./scripts/backup/backup-database.sh
```

#### `backup-database.bat` (Windows)
Batch script untuk backup database PostgreSQL di Windows.

```cmd
scripts\backup\backup-database.bat
```

### Restore Scripts (`restore/`)

#### `restore-files.sh`
Restore data dari backup files.

```bash
./scripts/restore/restore-files.sh
```

### Docker Scripts (`docker/`)

#### `docker-setup.sh`
Interactive setup script untuk Docker deployment.

```bash
./scripts/docker/docker-setup.sh
```

Pilih mode:
- **Production**: Optimized build tanpa hot-reload
- **Development**: Hot-reload untuk development

## 📝 Usage Tips

### Backup Database
```bash
# Otomatis dengan script
./scripts/backup/backup-database.sh

# Atau manual dengan Docker
make backup
```

### Restore Database
```bash
# Dengan script
./scripts/restore/restore-files.sh

# Atau dengan Docker
make restore FILE=backup.sql
```

### Docker Setup
```bash
# Interactive setup
./scripts/docker/docker-setup.sh

# Atau gunakan Makefile (recommended)
make help
```

## 🔐 Permissions

Jika script tidak bisa dijalankan, berikan permission:

```bash
chmod +x scripts/backup/*.sh
chmod +x scripts/restore/*.sh
chmod +x scripts/docker/*.sh
```

## 📚 Related Documentation

- **Backup & Restore**: [docs/features/BACKUP_RESTORE_DOCUMENTATION.md](../docs/features/BACKUP_RESTORE_DOCUMENTATION.md)
- **Docker Setup**: [docs/setup/DOCKER_SETUP.md](../docs/setup/DOCKER_SETUP.md)
- **Quick Reference**: [docs/setup/DOCKER_QUICK_REFERENCE.md](../docs/setup/DOCKER_QUICK_REFERENCE.md)

---

**Note**: Untuk kemudahan, gunakan Makefile commands dari root directory:
```bash
make backup    # Backup database
make restore   # Restore database
make help      # Lihat semua commands
```
