from fastapi.testclient import TestClient


def test_main_root_endpoint(client: TestClient):
    """Test the root endpoint of the application."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"].startswith("Welcome to the")
    assert "docs" in response.json()


def test_openapi_docs_available(client: TestClient):
    """Test that OpenAPI docs are available."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

    # Also check OpenAPI schema
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    assert "application/json" in response.headers["content-type"]

    # Basic schema validation
    schema = response.json()
    assert "paths" in schema
    assert "components" in schema
    assert "schemas" in schema["components"]
