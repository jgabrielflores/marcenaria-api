from io import BytesIO
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from PIL import Image

from src.services import order_image as svc


def _png() -> bytes:
    buf = BytesIO()
    Image.new("RGB", (4, 4), (1, 2, 3)).save(buf, format="PNG")
    return buf.getvalue()


def _file(content_type: str = "image/png"):
    return SimpleNamespace(content_type=content_type, filename="x.png")


@pytest.mark.unit
def test_validate_accepts_real_png():
    # Should not raise.
    svc._validate(_file("image/png"), _png())


@pytest.mark.unit
def test_validate_rejects_empty_file():
    with pytest.raises(HTTPException) as exc:
        svc._validate(_file(), b"")
    assert exc.value.status_code == 400


@pytest.mark.unit
def test_validate_rejects_oversized_file():
    with pytest.raises(HTTPException) as exc:
        svc._validate(_file(), b"\x00" * (svc.MAX_IMAGE_BYTES + 1))
    assert exc.value.status_code == 400


@pytest.mark.unit
def test_validate_rejects_disallowed_content_type():
    with pytest.raises(HTTPException) as exc:
        svc._validate(_file("text/plain"), _png())
    assert exc.value.status_code == 400


@pytest.mark.unit
def test_validate_rejects_spoofed_image():
    with pytest.raises(HTTPException) as exc:
        svc._validate(_file("image/png"), b"definitely not an image")
    assert exc.value.status_code == 400


@pytest.mark.unit
def test_validate_rejects_disallowed_image_format():
    # A real image, declared as an allowed type, but in a format we don't accept (GIF).
    buf = BytesIO()
    Image.new("RGB", (4, 4), (1, 2, 3)).save(buf, format="GIF")
    with pytest.raises(HTTPException) as exc:
        svc._validate(_file("image/png"), buf.getvalue())
    assert exc.value.status_code == 400
