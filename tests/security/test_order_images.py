from io import BytesIO

import pytest
from PIL import Image

from tests.conftest import ORDER_PAYLOAD


def _png_bytes() -> bytes:
    buf = BytesIO()
    Image.new("RGB", (8, 8), (10, 20, 30)).save(buf, format="PNG")
    return buf.getvalue()


def _admin_order_with_image(client, admin_headers) -> tuple[str, str]:
    order_id = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=admin_headers).json()["id"]
    image_id = client.post(
        f"/api/v1/orders/{order_id}/images",
        files=[("files", ("a.png", _png_bytes(), "image/png"))],
        headers=admin_headers,
    ).json()["images"][0]["id"]
    return order_id, image_id


@pytest.mark.security
def test_upload_image_without_auth_returns_4xx(client):
    resp = client.post(
        "/api/v1/orders/00000000-0000-0000-0000-000000000000/images",
        files=[("files", ("a.png", _png_bytes(), "image/png"))],
    )
    assert resp.status_code in (401, 403)


@pytest.mark.security
def test_customer_cannot_upload_to_another_users_order(client, customer_headers, admin_headers):
    order_id = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=admin_headers).json()["id"]
    resp = client.post(
        f"/api/v1/orders/{order_id}/images",
        files=[("files", ("a.png", _png_bytes(), "image/png"))],
        headers=customer_headers,
    )
    assert resp.status_code == 403


@pytest.mark.security
def test_customer_cannot_read_another_users_image(client, customer_headers, admin_headers):
    order_id, image_id = _admin_order_with_image(client, admin_headers)
    resp = client.get(f"/api/v1/orders/{order_id}/images/{image_id}", headers=customer_headers)
    assert resp.status_code == 403


@pytest.mark.security
def test_customer_cannot_delete_another_users_image(client, customer_headers, admin_headers):
    order_id, image_id = _admin_order_with_image(client, admin_headers)
    resp = client.delete(f"/api/v1/orders/{order_id}/images/{image_id}", headers=customer_headers)
    assert resp.status_code == 403
