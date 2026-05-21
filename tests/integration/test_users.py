import pytest


@pytest.mark.integration
def test_get_me_returns_current_user(client, customer_headers):
    body = client.get("/api/v1/me", headers=customer_headers).json()
    assert body["email"] == "alice@test.com"
    assert "password_hash" not in body


@pytest.mark.integration
def test_get_me_requires_auth(client):
    resp = client.get("/api/v1/me")
    assert resp.status_code in (401, 403)


@pytest.mark.integration
def test_update_me_changes_name(client, customer_headers):
    resp = client.patch("/api/v1/me", json={"name": "Alice Souza"}, headers=customer_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Alice Souza"


@pytest.mark.integration
def test_change_password_with_correct_current_succeeds(client, customer_headers):
    resp = client.patch(
        "/api/v1/me/password",
        json={"current_password": "password123", "new_password": "newpassword456"},
        headers=customer_headers,
    )
    assert resp.status_code == 204


@pytest.mark.integration
def test_change_password_with_wrong_current_returns_400(client, customer_headers):
    resp = client.patch(
        "/api/v1/me/password",
        json={"current_password": "wrongpassword", "new_password": "newpassword456"},
        headers=customer_headers,
    )
    assert resp.status_code == 400


@pytest.mark.integration
def test_change_password_below_minimum_length_returns_422(client, customer_headers):
    resp = client.patch(
        "/api/v1/me/password",
        json={"current_password": "password123", "new_password": "short"},
        headers=customer_headers,
    )
    assert resp.status_code == 422
