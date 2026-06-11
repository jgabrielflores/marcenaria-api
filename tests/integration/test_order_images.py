import uuid
from io import BytesIO

import pytest
from PIL import Image

from src.models.user import User
from src.services import order_image as image_service
from tests.conftest import ORDER_PAYLOAD


def _png_bytes(color: tuple = (200, 120, 40)) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (8, 8), color).save(buf, format="PNG")
    return buf.getvalue()


def _create_order(client, headers) -> str:
    return client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=headers).json()["id"]


def _upload(client, order_id, headers, files=None):
    files = files or [("files", ("ambiente.png", _png_bytes(), "image/png"))]
    return client.post(f"/api/v1/orders/{order_id}/images", files=files, headers=headers)


# ── POST /{order_id}/images ───────────────────────────────────────────────────


@pytest.mark.integration
def test_upload_image_returns_201_with_metadata(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    resp = _upload(client, order_id, customer_headers)
    assert resp.status_code == 201
    images = resp.json()["images"]
    assert len(images) == 1
    img = images[0]
    assert img["filename"] == "ambiente.png"
    assert img["content_type"] == "image/png"
    assert img["size"] > 0
    assert "data" not in img  # bytes are never embedded in the order payload


@pytest.mark.integration
def test_upload_multiple_images_up_to_five(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    files = [("files", (f"img{i}.png", _png_bytes(), "image/png")) for i in range(5)]
    resp = _upload(client, order_id, customer_headers, files=files)
    assert resp.status_code == 201
    assert len(resp.json()["images"]) == 5


@pytest.mark.integration
def test_upload_exceeding_five_returns_400(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    files = [("files", (f"img{i}.png", _png_bytes(), "image/png")) for i in range(5)]
    _upload(client, order_id, customer_headers, files=files)

    resp = _upload(client, order_id, customer_headers)
    assert resp.status_code == 400
    # The cap holds — the order still has exactly five images.
    order = client.get(f"/api/v1/orders/{order_id}", headers=customer_headers).json()
    assert len(order["images"]) == 5


@pytest.mark.integration
def test_upload_too_large_returns_400(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    oversized = b"\x00" * (image_service.MAX_IMAGE_BYTES + 1)
    resp = _upload(
        client, order_id, customer_headers, files=[("files", ("big.png", oversized, "image/png"))]
    )
    assert resp.status_code == 400


@pytest.mark.integration
def test_upload_disallowed_content_type_returns_400(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    resp = _upload(
        client,
        order_id,
        customer_headers,
        files=[("files", ("notes.txt", _png_bytes(), "text/plain"))],
    )
    assert resp.status_code == 400


@pytest.mark.integration
def test_upload_spoofed_image_returns_400(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    resp = _upload(
        client,
        order_id,
        customer_headers,
        files=[("files", ("fake.png", b"this is not an image", "image/png"))],
    )
    assert resp.status_code == 400


@pytest.mark.integration
def test_admin_can_upload_to_customer_order(client, customer_headers, admin_headers):
    order_id = _create_order(client, customer_headers)
    resp = _upload(client, order_id, admin_headers)
    assert resp.status_code == 201


@pytest.mark.integration
def test_upload_to_missing_order_returns_404(client, customer_headers):
    resp = _upload(client, str(uuid.uuid4()), customer_headers)
    assert resp.status_code == 404


@pytest.mark.integration
def test_upload_after_leaving_analysis_returns_409(client, customer_headers, admin_headers):
    order_id = _create_order(client, customer_headers)
    client.patch(
        f"/api/v1/orders/{order_id}", json={"status": "EM_ORCAMENTO"}, headers=admin_headers
    )
    resp = _upload(client, order_id, customer_headers)
    assert resp.status_code == 409


@pytest.mark.integration
def test_add_images_with_empty_list_returns_400(db, client, customer_headers):
    # FastAPI's File(...) guarantees at least one file over HTTP, so the empty-list
    # guard is exercised by calling the service directly with the shared session.
    order_id = _create_order(client, customer_headers)
    user = db.query(User).filter(User.email == "alice@test.com").one()
    with pytest.raises(Exception) as exc:
        image_service.add_images(db, user, uuid.UUID(order_id), [])
    assert getattr(exc.value, "status_code", None) == 400


# ── GET /{order_id}/images/{image_id} ─────────────────────────────────────────


@pytest.mark.integration
def test_get_image_returns_bytes(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    data = _png_bytes()
    image_id = _upload(
        client, order_id, customer_headers, files=[("files", ("a.png", data, "image/png"))]
    ).json()["images"][0]["id"]

    resp = client.get(f"/api/v1/orders/{order_id}/images/{image_id}", headers=customer_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert resp.content == data


@pytest.mark.integration
def test_get_missing_image_returns_404(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    resp = client.get(f"/api/v1/orders/{order_id}/images/{uuid.uuid4()}", headers=customer_headers)
    assert resp.status_code == 404


# ── DELETE /{order_id}/images/{image_id} ──────────────────────────────────────


@pytest.mark.integration
def test_delete_image_removes_it(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    image_id = _upload(client, order_id, customer_headers).json()["images"][0]["id"]

    resp = client.delete(f"/api/v1/orders/{order_id}/images/{image_id}", headers=customer_headers)
    assert resp.status_code == 204
    order = client.get(f"/api/v1/orders/{order_id}", headers=customer_headers).json()
    assert order["images"] == []


@pytest.mark.integration
def test_delete_missing_image_returns_404(client, customer_headers):
    order_id = _create_order(client, customer_headers)
    resp = client.delete(
        f"/api/v1/orders/{order_id}/images/{uuid.uuid4()}", headers=customer_headers
    )
    assert resp.status_code == 404


@pytest.mark.integration
def test_delete_after_leaving_analysis_returns_409(client, customer_headers, admin_headers):
    order_id = _create_order(client, customer_headers)
    image_id = _upload(client, order_id, customer_headers).json()["images"][0]["id"]
    client.patch(
        f"/api/v1/orders/{order_id}", json={"status": "EM_ORCAMENTO"}, headers=admin_headers
    )
    resp = client.delete(f"/api/v1/orders/{order_id}/images/{image_id}", headers=customer_headers)
    assert resp.status_code == 409
