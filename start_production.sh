#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the application with Gunicorn
gunicorn --config gunicorn_config.py "app:create_app()"