import pytest
import os
import sys
from unittest.mock import MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture
def app():
    """Create and configure a test app."""
    # Mock database module to avoid real DB connections in tests
    sys.modules['db'] = MagicMock()
    
    from app import create_app
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SECRET_KEY": "test-secret-key"
    })
    
    with app.app_context():
        yield app

@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create a test CLI runner."""
    return app.test_cli_runner()