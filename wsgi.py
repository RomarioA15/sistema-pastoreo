"""
WSGI entry point for Railway deployment
"""
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set production environment
os.environ.setdefault('FLASK_ENV', 'production')

# Create necessary directories
directories = ['logs', 'flask_session', 'proyecto/static/uploads']
for directory in directories:
    os.makedirs(directory, exist_ok=True)

# Import the Flask app
from app import app

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)