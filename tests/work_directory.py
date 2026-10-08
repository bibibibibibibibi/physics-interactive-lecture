"""Keep test fixtures in ignored work/ so failures remain inspectable."""

from pathlib import Path
import tempfile


def make_test_directory(prefix):
    root = Path(__file__).resolve().parents[1] / "work/tests"
    root.mkdir(parents=True, exist_ok=True)
    return Path(tempfile.mkdtemp(prefix=prefix, dir=root))
