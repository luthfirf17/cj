# 📁 Project Structure - Catat Jasamu

Dokumentasi lengkap struktur folder dan file project.

## 🌳 Directory Tree

```
CatatJasamu/
├── 📂 backend/                 # Backend API (Node.js + Express)
│   ├── 📂 src/
│   │   ├── 📂 config/          # Database & app configuration
│   │   ├── 📂 controllers/     # Business logic controllers
│   │   ├── 📂 middlewares/     # Express middlewares
│   │   ├── 📂 migrations/      # Database migrations
│   │   ├── 📂 models/          # Data models
│   │   ├── 📂 routes/          # API routes
│   │   ├── 📂 seeders/         # Database seeders
│   │   ├── 📂 utils/           # Utility functions
│   │   └── server.js           # Main server file
│   ├── Dockerfile              # Docker config for backend
│   ├── .dockerignore
│   ├── .env                    # Environment variables (gitignored)
│   ├── .env.example            # Environment template
│   └── package.json            # Node dependencies
│
├── 📂 frontend/                # Frontend App (React + Vite)
│   ├── 📂 src/
│   │   ├── 📂 assets/          # Images, fonts, static files
│   │   ├── 📂 components/      # React components
│   │   │   ├── Admin/          # Admin components
│   │   │   ├── Common/         # Shared components
│   │   │   └── User/           # User components
│   │   ├── 📂 context/         # React context (state management)
│   │   ├── 📂 hooks/           # Custom React hooks
│   │   ├── 📂 pages/           # Page components
│   │   │   ├── Admin/          # Admin pages
│   │   │   └── User/           # User pages
│   │   ├── 📂 services/        # API services
│   │   ├── 📂 styles/          # CSS styles
│   │   ├── 📂 utils/           # Utility functions
│   │   ├── App.jsx             # Main App component
│   │   └── main.jsx            # Entry point
│   ├── 📂 public/              # Public static files
│   ├── Dockerfile              # Docker config (production)
│   ├── Dockerfile.dev          # Docker config (development)
│   ├── nginx.conf              # Nginx configuration
│   ├── .dockerignore
│   ├── index.html              # HTML template
│   ├── package.json            # Node dependencies
│   ├── tailwind.config.js      # Tailwind CSS config
│   └── vite.config.js          # Vite config
│
├── 📂 docs/                    # 📚 Documentation
│   ├── 📂 api/                 # API documentation
│   ├── 📂 architecture/        # System architecture docs
│   ├── 📂 development/         # Development guides
│   ├── 📂 features/            # Feature documentation
│   ├── 📂 security/            # Security docs
│   ├── 📂 setup/               # Setup & installation guides
│   │   ├── DOCKER_SETUP.md
│   │   ├── DOCKER_QUICK_REFERENCE.md
│   │   └── DOCKER_INSTALLATION_COMPLETE.md
│   ├── 📂 user-guide/          # User guides
│   ├── INDEX.md                # Documentation index
│   └── README.md               # Docs overview
│
├── 📂 scripts/                 # 📜 Utility Scripts
│   ├── 📂 backup/              # Backup scripts
│   │   ├── backup-data-nodejs.js
│   │   ├── backup-database.sh
│   │   └── backup-database.bat
│   ├── 📂 docker/              # Docker scripts
│   │   └── docker-setup.sh
│   ├── 📂 restore/             # Restore scripts
│   │   └── restore-files.sh
│   └── README.md               # Scripts documentation
│
├── 📂 docker/                  # 🐳 Docker Configuration
│   ├── docker-compose.yml      # Production config
│   ├── docker-compose.dev.yml  # Development config
│   ├── .env.docker             # Environment template
│   └── README.md               # Docker docs
│
├── 📂 database_backups/        # Database backup files (gitignored)
│
├── 🔗 docker-compose.yml       # Symlink to docker/docker-compose.yml
├── 🔗 docker-compose.dev.yml   # Symlink to docker/docker-compose.dev.yml
│
├── Makefile                    # Make commands for Docker
├── .gitignore                  # Git ignore rules
└── README.md                   # 📖 Main documentation
```

## 📋 Key Directories Explained

### 🔧 Backend (`/backend`)

Backend API menggunakan **Node.js** dengan **Express.js** framework dan **PostgreSQL** database.

**Key Files:**
- `src/server.js` - Entry point, setup Express app
- `src/config/database.js` - Database connection configuration
- `src/routes/` - API route definitions
- `src/controllers/` - Business logic untuk setiap endpoint
- `src/middlewares/authMiddleware.js` - JWT authentication
- `src/migrations/` - Database schema migrations

**Environment:**
- `.env` - Environment variables (local, gitignored)
- `.env.example` - Template untuk setup baru

### 🎨 Frontend (`/frontend`)

Frontend menggunakan **React 18** dengan **Vite** build tool dan **Tailwind CSS**.

**Key Directories:**
- `src/components/` - Reusable React components
  - `Common/` - Shared components (Logo, Navbar, etc)
  - `User/` - User-specific components
  - `Admin/` - Admin-specific components
- `src/pages/` - Full page components
- `src/services/` - API integration layer
- `src/context/` - Global state management
- `src/hooks/` - Custom React hooks

**Configuration:**
- `vite.config.js` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS customization
- `nginx.conf` - Production web server config

### 📚 Documentation (`/docs`)

Dokumentasi lengkap terorganisir berdasarkan kategori:

- **api/** - API endpoint documentation
- **architecture/** - System design & database schema
- **development/** - Developer guides & troubleshooting
- **features/** - Feature-specific documentation
- **security/** - Authentication & authorization docs
- **setup/** - Installation & deployment guides
- **user-guide/** - End-user documentation

### 📜 Scripts (`/scripts`)

Utility scripts terorganisir berdasarkan fungsi:

- **backup/** - Database backup scripts
- **restore/** - Data restore scripts
- **docker/** - Docker setup & deployment scripts

### 🐳 Docker (`/docker`)

Konfigurasi Docker untuk deployment:

- `docker-compose.yml` - Production setup (optimized)
- `docker-compose.dev.yml` - Development setup (hot-reload)
- `.env.docker` - Environment variables template

**Symlinks** di root directory untuk kemudahan akses.

## 🔑 Important Files

### Root Level

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `Makefile` | Docker command shortcuts |
| `.gitignore` | Files to ignore in git |
| `docker-compose.yml` | Symlink to docker config |

### Backend

| File | Purpose |
|------|---------|
| `src/server.js` | Main server entry point |
| `src/config/database.js` | PostgreSQL connection |
| `.env` | Environment configuration |
| `package.json` | Node.js dependencies |
| `Dockerfile` | Docker image config |

### Frontend

| File | Purpose |
|------|---------|
| `src/main.jsx` | React app entry point |
| `src/App.jsx` | Main app component |
| `vite.config.js` | Vite configuration |
| `tailwind.config.js` | Tailwind CSS config |
| `package.json` | Node.js dependencies |
| `Dockerfile` | Docker production image |
| `Dockerfile.dev` | Docker dev image |

## 🎯 File Naming Conventions

### React Components
- **PascalCase**: `UserDashboard.jsx`, `AddBookingModal.jsx`
- **Organized by feature**: Components grouped by usage

### Backend Files
- **camelCase**: `authController.js`, `userRoutes.js`
- **Descriptive names**: Function and purpose clear from name

### Documentation
- **UPPERCASE_WITH_UNDERSCORES**: `DOCKER_SETUP.md`, `API_OVERVIEW.md`
- **Descriptive**: Clear indication of content

### Scripts
- **kebab-case**: `backup-database.sh`, `docker-setup.sh`
- **Executable**: Scripts have execute permissions

## 🗂️ Organization Principles

### 1. **Separation of Concerns**
- Backend dan Frontend terpisah
- Documentation terorganisir per kategori
- Scripts dikelompokkan berdasarkan fungsi

### 2. **Modularity**
- Components bersifat reusable
- Controllers handle specific business logic
- Middlewares untuk cross-cutting concerns

### 3. **Clarity**
- Naming yang jelas dan konsisten
- README di setiap folder utama
- Documentation lengkap dan terstruktur

### 4. **Scalability**
- Struktur mendukung pertumbuhan project
- Easy to add new features
- Clear separation between concerns

## 🚀 Quick Navigation

```bash
# Backend
cd backend/src              # Source code
cd backend/src/routes       # API routes
cd backend/src/controllers  # Business logic

# Frontend
cd frontend/src             # Source code
cd frontend/src/components  # React components
cd frontend/src/pages       # Page components

# Documentation
cd docs                     # All docs
cd docs/setup              # Setup guides
cd docs/features           # Feature docs

# Scripts
cd scripts/backup          # Backup scripts
cd scripts/docker          # Docker scripts

# Docker
cd docker                  # Docker config
```

## 📝 Notes

1. **Symlinks**: `docker-compose.yml` files di root adalah symlinks ke `/docker` folder
2. **Gitignore**: `.env`, `node_modules`, dan `database_backups` tidak di-commit
3. **Backups**: Database backups disimpan di `database_backups/` (gitignored)
4. **Documentation**: Selalu update docs saat menambah fitur baru

## 🔗 Related Documentation

- [README.md](../README.md) - Project overview
- [docs/INDEX.md](INDEX.md) - Documentation index
- [scripts/README.md](../scripts/README.md) - Scripts guide
- [docker/README.md](../docker/README.md) - Docker guide

---

**Last Updated**: November 11, 2025
