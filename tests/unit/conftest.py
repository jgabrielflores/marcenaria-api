from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session


@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock(spec=Session)
