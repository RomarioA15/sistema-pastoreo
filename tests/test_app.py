"""Basic app tests"""
import pytest

@pytest.mark.unit
def test_app_creation(app):
    """Test that the app can be created."""
    assert app is not None
    assert app.config['TESTING'] is True

@pytest.mark.unit
def test_health_endpoint(client):
    """Test the health endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'