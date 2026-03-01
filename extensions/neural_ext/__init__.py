"""
Neural accelerator bridge (Python + optional C++).

Falls back to pure Python if the native library cannot be built/loaded.
"""

from __future__ import annotations

import ctypes
import logging
import platform
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Mapping, MutableMapping, Sequence


logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent
NATIVE_NAME = "neural_boost.dll" if platform.system() == "Windows" else "neural_boost.so"
NATIVE_PATH = ROOT / NATIVE_NAME
SRC_PATH = ROOT / "neural_boost.cpp"


def _strip_control(text: str) -> str:
    return re.sub(r"[\x00-\x1f\x7f]", "", text or "").strip()


def _python_score(a: str, b: str) -> float:
    a = _strip_control(a.lower())
    b = _strip_control(b.lower())
    if not a or not b:
        return 0.0

    tokens_a = set(re.findall(r"[a-z0-9]+", a))
    tokens_b = set(re.findall(r"[a-z0-9]+", b))
    if not tokens_a or not tokens_b:
        return 0.0

    inter = len(tokens_a & tokens_b)
    union = len(tokens_a | tokens_b)
    jaccard = inter / union if union else 0.0

    # Quick character prefix overlap to reward close matches.
    prefix = sum(1 for x, y in zip(a, b) if x == y)
    prefix_score = prefix / max(1, min(len(a), len(b)))

    return (0.65 * jaccard) + (0.35 * prefix_score)


def _build_native() -> Path | None:
    compiler = shutil.which("g++") or shutil.which("clang++")
    if not compiler:
        logger.debug("No compiler available; skipping native build.")
        return None

    cmd = [
        compiler,
        "-std=c++17",
        "-O3",
        "-shared",
        "-fPIC",
        str(SRC_PATH),
        "-o",
        str(NATIVE_PATH),
    ]
    if platform.system() == "Windows":
        cmd.extend(["-static", "-static-libgcc", "-static-libstdc++"])

    try:
        ROOT.mkdir(parents=True, exist_ok=True)
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return NATIVE_PATH if NATIVE_PATH.exists() else None
    except Exception as exc:
        logger.debug("Native build failed: %s", exc)
        return None


@dataclass
class RankedDoc:
    id: str
    title: str
    score: float
    snippet: str | None = None


class NeuralAccelerator:
    """Blend of native similarity scoring with Python fallback."""

    def __init__(self) -> None:
        self.lib = self._load_native()

    def _load_native(self):
        if NATIVE_PATH.exists():
            return self._load_lib(NATIVE_PATH)

        built = _build_native()
        if built:
            return self._load_lib(built)
        return None

    def _load_lib(self, path: Path):
        try:
            lib = ctypes.CDLL(str(path))
            lib.hybrid_score.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
            lib.hybrid_score.restype = ctypes.c_double
            logger.info("Loaded neural_ext native library: %s", path.name)
            return lib
        except Exception as exc:
            logger.debug("Failed to load native lib %s: %s", path, exc)
            return None

    @property
    def available(self) -> bool:
        return self.lib is not None

    def score(self, a: str, b: str) -> float:
        a = _strip_control(a)
        b = _strip_control(b)
        if not a or not b:
            return 0.0

        if self.lib:
            try:
                return float(self.lib.hybrid_score(a.encode("utf-8"), b.encode("utf-8")))
            except Exception as exc:
                logger.debug("Native score failed, falling back: %s", exc)
        return _python_score(a, b)

    def rank_documents(
        self,
        query: str,
        docs: Sequence[Mapping[str, str]],
        top_k: int = 3,
    ) -> List[RankedDoc]:
        if not query or not docs:
            return []

        scores: List[RankedDoc] = []
        for doc in docs:
            text = doc.get("text") or ""
            title = doc.get("title") or doc.get("id") or "doc"
            snippet = doc.get("snippet")
            score = self.score(query, text)
            if score <= 0:
                continue
            scores.append(
                RankedDoc(
                    id=str(doc.get("id") or title),
                    title=title,
                    score=float(round(score, 3)),
                    snippet=snippet,
                )
            )

        scores.sort(key=lambda d: d.score, reverse=True)
        return scores[:top_k]


__all__ = ["NeuralAccelerator", "RankedDoc"]
