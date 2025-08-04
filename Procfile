web: python3 -m gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:app
release: python3 init_railway_db.py