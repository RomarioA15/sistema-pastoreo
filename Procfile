web: . /opt/venv/bin/activate && gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:app
release: . /opt/venv/bin/activate && python init_railway_db.py