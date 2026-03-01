"""
Simple builder for the native neural boost library.
Run: python -m neural_ext.build
"""

from __future__ import annotations

import platform
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SRC = ROOT / "neural_boost.cpp"


def _default_output() -> Path:
    suffix = ".dll" if platform.system() == "Windows" else ".so"
    return ROOT / f"neural_boost{suffix}"


def build(output: Path | None = None) -> Path:
    """Attempt to compile the C++ helper. Returns the path even if it fails to exist."""
    output = output or _default_output()

    compiler = shutil.which("g++") or shutil.which("clang++")
    if not compiler:
        raise RuntimeError("No C++ compiler (g++/clang++) found on PATH.")

    cmd = [
        compiler,
        "-std=c++17",
        "-O3",
        "-shared",
        "-fPIC",
        str(SRC),
        "-o",
        str(output),
    ]

    # Extra static flags help on Windows with MinGW
    if platform.system() == "Windows":
        cmd.extend(["-static", "-static-libgcc", "-static-libstdc++"])

    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(cmd, check=True)
    return output


if __name__ == "__main__":
    try:
        out = build()
        print(f"Built native library -> {out}")
    except Exception as exc:
        print(f"[neural_ext] build failed: {exc}")
