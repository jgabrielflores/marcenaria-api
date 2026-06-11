"""Order environment-image handling.

Images are stored as bytes in Postgres (no external object storage). Customers
(and admins on walk-in orders) attach up to 5 photos so the workshop can see the
space before drafting the project/quote. Add/remove is only allowed while the
order is still in AGUARDANDO_ANALISE — the same edit window the rest of the order
already uses.
"""

import io
import uuid

from fastapi import HTTPException, UploadFile
from fastapi import status as http_status
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from src.models.order import Order, OrderStatus
from src.models.order_image import OrderImage
from src.models.user import User
from src.services.order import get_order

MAX_IMAGES_PER_ORDER = 5
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
# Allowed MIME types and the Pillow format names they must actually decode to.
ALLOWED_CONTENT_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
ALLOWED_FORMATS = frozenset({"JPEG", "PNG", "WEBP"})


def _assert_editable(order: Order) -> None:
    if order.status != OrderStatus.AGUARDANDO_ANALISE:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Images can only be changed while the order is awaiting analysis",
        )


def _validate(file: UploadFile, data: bytes) -> None:
    """Reject anything that is not a small JPEG/PNG/WebP. Validates the actual
    decoded image (not just the declared content type) to block spoofing."""
    if len(data) == 0:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Each image must be at most 5 MB",
        )
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG or WebP images are allowed",
        )
    try:
        with Image.open(io.BytesIO(data)) as img:
            image_format = img.format
            img.verify()
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="File is not a valid image",
        ) from None
    if image_format not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG or WebP images are allowed",
        )


def add_images(db: Session, user: User, order_id: uuid.UUID, files: list[UploadFile]) -> Order:
    """Attach one or more images to an order. Enforces the 5-image cap."""
    order = get_order(db, user, order_id)  # 403/404 via IDOR guard
    _assert_editable(order)

    if not files:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST, detail="No images provided"
        )
    if len(order.images) + len(files) > MAX_IMAGES_PER_ORDER:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"An order can have at most {MAX_IMAGES_PER_ORDER} images",
        )

    for file in files:
        data = file.file.read()
        _validate(file, data)
        order.images.append(
            OrderImage(
                filename=file.filename or "image",
                content_type=file.content_type or "application/octet-stream",
                size=len(data),
                data=data,
            )
        )

    db.commit()
    db.refresh(order)
    return order


def _get_image_or_404(db: Session, order_id: uuid.UUID, image_id: uuid.UUID) -> OrderImage:
    image = db.get(OrderImage, image_id)
    if image is None or image.order_id != order_id:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Image not found")
    return image


def get_image(db: Session, user: User, order_id: uuid.UUID, image_id: uuid.UUID) -> OrderImage:
    """Return a single image (with bytes) if the viewer may see the order."""
    get_order(db, user, order_id)  # 403/404 via IDOR guard
    return _get_image_or_404(db, order_id, image_id)


def delete_image(db: Session, user: User, order_id: uuid.UUID, image_id: uuid.UUID) -> None:
    order = get_order(db, user, order_id)  # 403/404 via IDOR guard
    _assert_editable(order)
    image = _get_image_or_404(db, order_id, image_id)
    db.delete(image)
    db.commit()
