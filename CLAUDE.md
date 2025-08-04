# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Flask web application** for cattle ranch management (Sistema de Gestión de Pastoreo) v2.0. It's a comprehensive system for managing grazing operations, pastures, cattle, activities, and climate data.

## Development Commands

### Running the Application
```bash
# Primary method - recommended
python run.py

# Alternative method
python app.py
```

### Database Setup
```bash
# Create and initialize database
mysql -u root -p < database_migration_v2.sql
```

### Testing
The project uses manual testing - no automated test framework detected. Test by running the application and accessing endpoints.

### Environment Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp env_example.txt .env
```

## Architecture Overview

### Core Structure
- **Factory Pattern**: Application uses `create_app()` factory in `app.py`
- **Blueprint Architecture**: Routes organized in separate blueprints under `proyecto/routes/`
- **MVC Pattern**: Models in `proyecto/models/`, templates in `proyecto/templates/`, static files in `proyecto/static/`

### Key Components

**Main Application (`app.py`):**
- Factory pattern with `create_app()`
- Centralized configuration via `configure_app()`
- Blueprint registration system
- Error handling and logging setup

**Database Layer:**
- MySQL with custom connection wrapper in `db.py`
- Models using Flask-Login's UserMixin pattern
- Raw SQL queries (no ORM)
- Connection managed through `mysql.connection.cursor()`

**Authentication:**
- Flask-Login for session management
- Werkzeug for password hashing
- Simple role-based permissions system
- Default credentials: `admin@pastoreo.com` / `admin123`

**Routes Structure:**
- `auth.py` - Authentication (login/logout/register)
- `dashboard_simple.py` - Main dashboard
- `potreros.py` - Pasture management
- `aforos.py` - Forage measurements
- `actividades.py` - Activity tracking

### Database Schema
Main tables include:
- `users` - User authentication and profiles
- `fincas` - Ranch/farm information
- `potreros` - Pasture/paddock data
- `aforos` - Forage availability measurements
- `actividades` - Activity/task tracking
- `clima` - Climate data

### Static Assets Organization
```
proyecto/static/
├── css/design-system.css    # Main stylesheet with design system
├── js/
│   ├── main.js             # Core application logic
│   ├── modules/            # Feature-specific modules
│   └── utils/              # Utility functions
└── uploads/                # User uploaded files
```

### Template Structure
- `base.html` - Main layout template
- Feature-specific folders (actividades/, aforos/, potreros/, etc.)
- Educational variants available (e.g., `index_educational.html`)

## Configuration

### Environment Variables
The application reads from `.env` file or environment variables:
- `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB` - Database connection
- `SECRET_KEY` - Flask secret key for sessions
- `FLASK_ENV` - Environment (development/production)

### Default Configuration
- Host: `0.0.0.0`
- Port: `5000`
- Debug: `True` in development
- Session storage: Filesystem-based
- Database: MySQL with DictCursor

## Development Guidelines

### Adding New Features
1. Create blueprint in `proyecto/routes/`
2. Register blueprint in `app.create_app()`
3. Add templates in appropriate `proyecto/templates/` subfolder
4. Add static assets in `proyecto/static/`
5. Update database schema via migration SQL if needed

### Database Operations
- Use `mysql.connection.cursor()` for database operations
- Always use try/except blocks with proper rollback
- Use parameterized queries to prevent SQL injection
- Close cursors explicitly

### Authentication Flow
- All protected routes require `@login_required` decorator
- User permissions checked via `usuario_puede()` function
- Current user available as `current_user` in templates and routes

### Error Handling
- 404/500 error templates in `templates/errors/`
- Logging configured to both file (`logs/app.log`) and console
- Health check endpoint available at `/health`

## Project-Specific Notes

### Multi-tenant Architecture
- Application supports multiple ranches (`fincas`)
- Users can switch between ranches via session
- Data filtered by current ranch context

### Educational Mode
- Some templates have educational variants for training purposes
- Switch between operational and educational interfaces

### File Upload Handling
- Upload directory: `proyecto/static/uploads/`
- File size limit configured via `MAX_CONTENT_LENGTH`

### Climate Integration
- Weather data tracking and historical analysis
- Dashboard integration for environmental monitoring

This is a production-ready application with comprehensive ranch management capabilities, built for Spanish-speaking users in the cattle industry.