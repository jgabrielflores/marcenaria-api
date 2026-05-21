import uuid

import pytest
from fastapi import HTTPException

from src.models.user import Role, User
from src.schemas.user import PasswordChange, UserUpdate
from src.services.auth import pwd_context
from src.services.user import change_password, update_me


def _make_user(password: str = "password123") -> User:
    user = User()
    user.id = uuid.uuid4()
    user.name = "Alice"
    user.email = "alice@test.com"
    user.password_hash = pwd_context.hash(password)
    user.role = Role.CUSTOMER
    return user


@pytest.mark.unit
def test_update_me_changes_name(mock_db):
    user = _make_user()

    result = update_me(mock_db, user, UserUpdate(name="Alice Souza"))

    assert result.name == "Alice Souza"
    mock_db.commit.assert_called_once()


@pytest.mark.unit
def test_change_password_with_correct_current_password_updates_hash(mock_db):
    user = _make_user("oldpassword")
    old_hash = user.password_hash

    change_password(
        mock_db,
        user,
        PasswordChange(current_password="oldpassword", new_password="newpassword456"),
    )

    assert user.password_hash != old_hash
    assert pwd_context.verify("newpassword456", user.password_hash)
    mock_db.commit.assert_called_once()


@pytest.mark.unit
def test_change_password_with_wrong_current_password_raises_400(mock_db):
    user = _make_user("oldpassword")

    with pytest.raises(HTTPException) as exc:
        change_password(
            mock_db,
            user,
            PasswordChange(current_password="wrongpassword", new_password="newpassword456"),
        )

    assert exc.value.status_code == 400
    mock_db.commit.assert_not_called()
