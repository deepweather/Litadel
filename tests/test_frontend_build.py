"""
Test that the frontend can build successfully.

Run with: python tests/test_frontend_build.py
"""

import subprocess
import sys
from pathlib import Path


def test_frontend_build():
    """Test that frontend builds without errors."""
    frontend_dir = Path(__file__).parent.parent / "frontend"

    if not frontend_dir.exists():
        print("✗ Frontend directory not found")
        return False

    print("Building frontend (this may take a minute)...")

    try:
        result = subprocess.run(
            ["npm", "run", "build"],
            check=False,
            cwd=frontend_dir,
            capture_output=True,
            text=True,
            timeout=120,  # 2 minute timeout
        )

        if result.returncode == 0:
            print("✓ Frontend build successful")
            return True
        print(f"✗ Frontend build failed with exit code {result.returncode}")
        print("\nSTDERR:")
        print(result.stderr)
        return False

    except subprocess.TimeoutExpired:
        print("✗ Frontend build timed out after 2 minutes")
        return False
    except FileNotFoundError:
        print("✗ npm not found. Make sure Node.js is installed.")
        return False
    except Exception as e:
        print(f"✗ Frontend build crashed: {e}")
        return False


if __name__ == "__main__":
    success = test_frontend_build()
    sys.exit(0 if success else 1)
