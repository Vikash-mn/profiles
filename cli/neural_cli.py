"""
Interactive terminal AI client with optional backend + native accelerator.

Usage:
    python neural_cli.py --backend http://127.0.0.1:8016/api/ai/fastpath
    python neural_cli.py            # offline mode using local knowledge + C++ booster
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import textwrap
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

# Ensure project root is on sys.path so we can reuse shared helpers.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.utils.product_loader import load_products  # noqa: E402

try:
    from extensions.neural_ext import NeuralAccelerator
except Exception:  # pragma: no cover - fallback if package not present
    NeuralAccelerator = None  # type: ignore


def load_local_docs() -> List[Dict[str, Any]]:
    """Load lightweight knowledge base from products and profile snippets."""
    docs: List[Dict[str, Any]] = []
    products, _ = load_products()
    for item in products:
        text_parts = [
            item.get("name", ""),
            item.get("description", ""),
            " ".join(item.get("features", []) or []),
            " ".join([f"{k}: {v}" for k, v in (item.get("specifications") or {}).items()]),
        ]
        text = ". ".join([p for p in text_parts if p])
        if text.strip():
            docs.append(
                {
                    "id": item.get("id"),
                    "title": item.get("name", "Product"),
                    "text": text,
                    "snippet": (item.get("description") or "")[:200],
                }
            )

    docs.extend(
        [
            {
                "id": "bio",
                "title": "Who is Vikash",
                "text": "Security architect; offensive security, quantum-resistant cryptography, high-performance computing.",
                "snippet": "Security architect with quantum-resistant crypto focus.",
            },
            {
                "id": "services",
                "title": "Services",
                "text": "Custom security assessments, hardware security reviews, IoT solutions, quantum-resistant crypto consulting.",
                "snippet": "Security assessments, IoT solutions, crypto consulting.",
            },
        ]
    )
    return docs


def local_answer(query: str, docs: List[Dict[str, Any]], accel: Optional[Any]) -> Dict[str, Any]:
    if not query.strip():
        return {"answer": "Please enter a question.", "sources": []}

    sources: List[Dict[str, Any]] = []
    if accel:
        try:
            hits = accel.rank_documents(query, docs, top_k=3)
            sources = [dict(id=h.id, title=h.title, score=h.score, snippet=h.snippet) for h in hits]
        except Exception:
            sources = []

    if not sources and docs:
        # Very small fallback if native path is unavailable.
        from difflib import SequenceMatcher

        scored = []
        for doc in docs:
            ratio = SequenceMatcher(None, query.lower(), doc["text"].lower()).ratio()
            if ratio > 0.1:
                scored.append((ratio, doc))
        scored.sort(key=lambda x: x[0], reverse=True)
        sources = [
            {
                "id": d["id"],
                "title": d["title"],
                "score": round(score, 3),
                "snippet": d.get("snippet"),
            }
            for score, d in scored[:3]
        ]

    bullet_lines = [
        f"- {s['title']} ({int((s.get('score') or 0) * 100)}% match) {s.get('snippet') or ''}".strip()
        for s in sources
    ]
    answer_body = "I scanned local knowledge and found:\n" + "\n".join(bullet_lines) if bullet_lines else ""

    return {
        "answer": answer_body or "No strong local matches. Try running the backend for richer answers.",
        "intent": "local",
        "confidence": 0.55 if sources else 0.2,
        "sources": sources,
        "source": "offline",
    }


async def backend_answer(query: str, backend: str) -> Optional[Dict[str, Any]]:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(backend, json={"message": query})
            if resp.is_success:
                data = resp.json()
                return data.get("response") or data
    except Exception:
        return None
    return None


async def main() -> None:
    parser = argparse.ArgumentParser(description="Terminal AI helper")
    parser.add_argument(
        "--backend",
        default="http://127.0.0.1:8016/api/ai/fastpath",
        help="FastAPI endpoint to use (leave as default for local dev).",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Force offline mode (skip backend calls).",
    )
    args = parser.parse_args()

    docs = load_local_docs()
    accel = NeuralAccelerator() if NeuralAccelerator else None

    print("=== Neural Terminal CLI ===")
    print("Type 'exit' or Ctrl+C to quit.")
    if not args.offline:
        print(f"Backend: {args.backend}")
    else:
        print("Offline mode only (local knowledge + accelerator).")

    while True:
        try:
            q = input("\nneural> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye.")
            break

        if not q:
            continue
        if q.lower() in {"exit", "quit"}:
            break

        answer = None
        if not args.offline:
            answer = await backend_answer(q, args.backend)

        if not answer:
            answer = local_answer(q, docs, accel)

        print()
        wrapped = textwrap.fill(answer.get("answer", ""), width=88)
        print(wrapped)

        sources = answer.get("sources") or []
        if sources:
            print("\nSources:")
            for s in sources:
                score_pct = int((s.get("score") or 0) * 100)
                print(f"  - {s.get('title') or s.get('id')} ({score_pct}% match)")


if __name__ == "__main__":
    asyncio.run(main())

