"""
Rate-limiting verification.
Source: OWASP Testing Guide v4.2 — OTG-AUTHN-003 (account lockout / brute-force)
"""

import pytest


@pytest.mark.security
def test_excessive_login_attempts_are_rate_limited(client):
    """After 10 requests per minute, the 11th login attempt must return 429.

    The test loops until 429 is observed (or 15 attempts are exhausted), so it
    is resilient to however many login requests preceding tests may have already
    consumed from the same rate-limit window.
    """
    statuses = []
    for _ in range(15):
        resp = client.post(
            "/auth/login",
            json={
                "email": "brute@test.com",
                "password": "wrongpassword",
            },
        )
        statuses.append(resp.status_code)
        if resp.status_code == 429:
            break

    assert 429 in statuses, (
        f"Rate limit was not triggered after {len(statuses)} attempts: {statuses}"
    )


@pytest.mark.security
def test_rate_limit_response_uses_detail_shape(client):
    """The 429 response must follow the standard {"detail": "..."} error shape."""
    for _ in range(15):
        resp = client.post(
            "/auth/login",
            json={
                "email": "brute2@test.com",
                "password": "wrongpassword",
            },
        )
        if resp.status_code == 429:
            body = resp.json()
            assert "detail" in body
            assert "error" not in body
            return

    pytest.fail("Rate limit was never triggered — cannot verify response shape.")
