from __future__ import annotations

import re
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.config import logger
from app.services.neural_embedding import get_embedding_service, NeuralEmbeddingService
from app.database import DatabaseManager
from app.utils.product_loader import load_products

# AI SERVICE
# ============================================================================

class AIService:
    """AI chat service for store assistant"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        self.intent_patterns = {
            "greeting": [
                r"^(hi|hello|hey|greetings|sup|what'?s up|howdy)",
                r"^(good )?(morning|afternoon|evening)",
                r"nice to meet you"
            ],
            "product_inquiry": [
                r"(what|which|tell|show|find|search).*product",
                r"(have|got|sell|offer).*in stock",
                r"what (do|can) you (have|sell|offer)",
                r"browse|catalog|inventory|store",
                r"looking for|need|want to buy"
            ],
            "price_inquiry": [
                r"how much|price|cost|cheap|expensive|worth",
                r"\$\d+|\d+ dollars?",
                r"affordable|budget|deal|discount"
            ],
            "specification_inquiry": [
                r"specs?|specifications|features|details",
                r"what (does|do|is|are).*(do|specs|feature)",
                r"how (fast|powerful|big|small|heavy|large)"
            ],
            "stock_inquiry": [
                r"(in|out of) stock|available|inventory|restock",
                r"when (will|do) you (get|have|receive)",
                r"backorder|pre-?order"
            ],
            "order_inquiry": [
                r"order|purchase|buy|checkout|cart",
                r"where'?s my order|track (my )?order",
                r"order status|shipping|delivery|arrive"
            ],
            "clearance_inquiry": [
                r"clearance|restricted|permission|access",
                r"level \d+|clearance level",
                r"classified|secret|confidential"
            ],
            "fabrication_inquiry": [
                r"fabricat(ion|e|ing)|manufactur|production",
                r"custom (order|request|project)",
                r"pcb|circuit|assembly"
            ],
            "help": [
                r"help|assist|support|guide",
                r"how (do|can) i|what can you do",
                r"capabilities|features|functions"
            ],
            "contact": [
                r"contact|email|phone|reach|message",
                r"talk to (human|person|support|agent)",
                r"customer service|support"
            ],
            "farewell": [
                r"(bye|goodbye|see you|cya|farewell)",
                r"thanks? (for )?your help",
                r"that'?s all|that'?s it"
            ]
        }
        
        self.responses = {
            "greeting": [
                "Hello! Welcome to Vikash Hardware Store. How can I help you today?",
                "Hi there! I'm your hardware store assistant. What are you looking for?",
                "Greetings! Feel free to ask me about our products, orders, or technical specifications."
            ],
            "product_inquiry": [
                "We have a wide range of hardware including microcontrollers, SBCs, sensors, and IoT devices. Would you like to see a specific category?",
                "Our catalog includes development boards, custom fabrication services, and specialized hardware. What interests you?",
                "You can browse our products in the store section. We have over {product_count} items available right now."
            ],
            "price_inquiry": [
                "Our products range from $24.99 for basic components to $349+ for custom fabrication services. What's your budget?",
                "Prices vary by product. You can check individual product pages for exact pricing. Is there something specific you're interested in?",
                "We have competitive pricing on all our hardware. Many items include free shipping."
            ],
            "specification_inquiry": [
                "Each product has detailed specifications on its product page. What specific component are you interested in?",
                "You can find complete technical specs including dimensions, power requirements, and compatibility in the product details.",
                "Our product specifications are verified and tested. Let me know which item you'd like to learn more about."
            ],
            "stock_inquiry": [
                "Stock status is shown on each product page. Most items ship within 24 hours.",
                "We maintain real-time inventory. Green 'In Stock' items are ready to ship immediately.",
                "Some products are in fabrication and may have lead times. Check the status badge on each product."
            ],
            "order_inquiry": [
                "You can view your orders in the Purchase History section. Order confirmation is sent to your email.",
                "Orders typically process within 24 hours and ship within 3-5 business days.",
                "Need help with an existing order? Please provide your order number and I'll check the status."
            ],
            "clearance_inquiry": [
                "Certain restricted products require clearance level 4 or higher. Contact an administrator for access.",
                "Clearance levels are assigned based on verification. Most standard components don't require special access.",
                "If you see 'RESTRICTED' on a product, you'll need additional permissions to purchase it."
            ],
            "fabrication_inquiry": [
                "We offer custom fabrication services including PCB design, firmware hardening, and specialized hardware.",
                "Custom projects can be submitted through the 'Custom Forge' section. Typical turnaround is 5-10 business days.",
                "Our fabrication queue is currently {fabrication_count} items deep. Custom quotes are provided within 48 hours."
            ],
            "help": [
                "I can help you with product inquiries, orders, specifications, stock status, and more. What do you need assistance with?",
                "Here are some things I can help with:\n- Finding products\n- Checking prices\n- Order status\n- Technical specifications\n- Shipping information\n- Custom fabrication requests",
                "Just type your question naturally and I'll do my best to help!"
            ],
            "contact": [
                "For support, email support@vikash.dev or use the contact form on our website.",
                "Our team is available Monday-Friday, 9 AM - 6 PM EST. You can also reach us at support@vikash.dev.",
                "Need to talk to a human? Send an email to support@vikash.dev and we'll get back to you within 24 hours."
            ],
            "farewell": [
                "Thank you for visiting Vikash Hardware Store! Feel free to come back if you have more questions.",
                "Have a great day! Happy hardware hacking!",
                "Goodbye! Don't hesitate to reach out if you need anything else."
            ],
            "unknown": [
                "I'm not sure I understand. Could you rephrase that?",
                "I don't have an answer for that yet. Would you like to speak with a human representative?",
                "I'm still learning! Can you ask that in a different way?",
                "That's beyond my current capabilities. You can email support@vikash.dev for more complex inquiries."
            ]
        }
        
        # Lightweight retrieval corpus built from local product data (no DB required)
        self.vectorizer = None
        self.doc_matrix = None
        self.doc_meta: List[Dict[str, Any]] = []
        self._load_static_knowledge()
        self._load_profile_knowledge()

        # Optional native accelerator (C++ blend) for faster similarity scoring
        try:
            from neural_ext import NeuralAccelerator  # type: ignore
            self.accelerator = NeuralAccelerator()
        except Exception as exc:  # pragma: no cover - best effort
            logger.debug(f"AIService: accelerator unavailable ({exc})")
            self.accelerator = None
        
        # Neural Embedding System (lightweight, CPU-optimized)
        self.neural_embeddings = get_embedding_service()
        self.embedding_cache = {}
        self._initialize_neural_embeddings()
    
    def _initialize_neural_embeddings(self):
        """Initialize neural embeddings with training data"""
        try:
            # Get training texts from existing knowledge base
            training_texts = []
            
            # Add FAQ questions
            for faq_list in self.responses.values():
                training_texts.extend(faq_list)
            
            # Add document texts
            for doc in self.doc_meta:
                training_texts.append(doc.get('text', ''))
            
            # Initialize the neural embedding service
            self.neural_embeddings.initialize(training_texts)
            
            # Get embedding info
            embed_info = self.neural_embeddings.get_info()
            logger.info(f"[AI] Neural Embeddings initialized: {embed_info['total_parameters']:,} parameters")
            
        except Exception as e:
            logger.warning(f"[AI] Neural embeddings initialization failed: {e}")
    
    def get_neural_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity using neural embeddings"""
        try:
            # Check cache
            cache_key = f"{text1}|{text2}"
            if cache_key in self.embedding_cache:
                return self.embedding_cache[cache_key]
            
            # Get embeddings
            emb1 = self.neural_embeddings.get_embedding(text1.lower())
            emb2 = self.neural_embeddings.get_embedding(text2.lower())
            
            # Cosine similarity
            similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2) + 1e-8)
            
            # Cache result
            self.embedding_cache[cache_key] = float(similarity)
            
            return float(similarity)
        except Exception as e:
            logger.debug(f"Neural similarity error: {e}")
            return 0.0
    
    def detect_intent(self, message: str) -> Tuple[str, float]:
        """Detect the intent of a message"""
        message = message.lower().strip()
        
        if not message:
            return "unknown", 0.0
        
        # Check for matches
        best_intent = "unknown"
        best_score = 0.0
        
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    score = 0.8  # Base score
                    
                    # Boost score based on message length and pattern match
                    if len(message) < 20:
                        score += 0.1
                    if re.fullmatch(pattern, message, re.IGNORECASE):
                        score += 0.1
                    
                    if score > best_score:
                        best_score = score
                        best_intent = intent
                    break
        
        return best_intent, best_score
    
    def generate_response(
        self,
        message: str,
        intent: str,
        confidence: float,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate a response based on intent and context"""
        context = context or {}
        
        # Select response template
        if intent in self.responses:
            responses = self.responses[intent]
            response = responses[int(hash(message) % len(responses))]
        else:
            responses = self.responses["unknown"]
            response = responses[int(hash(message) % len(responses))]
        
        # Format response with context variables
        if "{product_count}" in response:
            product_count = context.get("product_count", "many")
            response = response.replace("{product_count}", str(product_count))
        
        if "{fabrication_count}" in response:
            fabrication_count = context.get("fabrication_count", "several")
            response = response.replace("{fabrication_count}", str(fabrication_count))
        
        # Add confidence indicator for low confidence
        if confidence < 0.6:
            response += " " + "I think" if not response.endswith('?') else ""
        
        return response
    
    def _load_static_knowledge(self) -> None:
        """Build a small retrieval corpus from local product data so answers feel contextual even offline."""
        try:
            products, _ = load_products()
            for item in products:
                text_parts = [
                    item.get("name", ""),
                    item.get("description", ""),
                    " ".join(item.get("features", []) or []),
                    " ".join([f"{k}: {v}" for k, v in (item.get("specifications") or {}).items()])
                ]
                text = ". ".join([p for p in text_parts if p])
                if text.strip():
                    self.doc_meta.append({
                        "id": item.get("id"),
                        "title": item.get("name", "Product"),
                        "snippet": (item.get("description") or "")[:220],
                        "text": text
                    })
        except Exception as e:
            logger.warning(f"AIService: failed to load local product corpus: {e}")
        
        # Only build vectorizer when we actually have documents
        if self.doc_meta:
            self._ensure_vectorizer()

    def _load_profile_knowledge(self) -> None:
        """Seed retrieval with portfolio data so the terminal can answer personal queries offline."""
        profile_docs = [
            {
                "id": "bio",
                "title": "Who is Vikash",
                "text": (
                    "Vikash is a security architect focused on offensive security, "
                    "quantum-resistant cryptography, and high-performance computing. "
                    "He builds neural-style interfaces, FastAPI backends, and hardware projects."
                ),
                "snippet": "Security architect with offensive security and quantum crypto focus."
            },
            {
                "id": "skills",
                "title": "Core Skills",
                "text": (
                    "Expert in Python, C++, and JavaScript with experience in FastAPI, "
                    "hardware design, reverse engineering, DevSecOps, and threat modelling."
                ),
                "snippet": "Python/C++/JS, FastAPI, reverse engineering, DevSecOps."
            },
            {
                "id": "projects",
                "title": "Projects",
                "text": (
                    "Built a cyberpunk portfolio with terminal interface, distributed neural sync, "
                    "and dark web themed store. Projects include custom PCB design, firmware work, "
                    "and penetration testing toolchains."
                ),
                "snippet": "Cyberpunk terminal portfolio, PCB design, firmware, pentest tools."
            },
            {
                "id": "services",
                "title": "Services",
                "text": (
                    "Offers custom security assessments, hardware security reviews, IoT solutions, "
                    "and quantum-resistant cryptography consulting."
                ),
                "snippet": "Security assessments, IoT solutions, quantum-resistant crypto consulting."
            },
        ]

        self.doc_meta.extend(profile_docs)
        # Rebuild vectorizer to include the new docs.
        self.vectorizer = None
        self.doc_matrix = None
        self._ensure_vectorizer()
    
    def _ensure_vectorizer(self) -> None:
        """Initialize TF-IDF vectorizer lazily."""
        if self.vectorizer or not self.doc_meta:
            return
        try:
            corpus = [d["text"] for d in self.doc_meta]
            self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=1)
            self.doc_matrix = self.vectorizer.fit_transform(corpus)
        except Exception as e:
            logger.warning(f"AIService: failed to build vectorizer: {e}")
            self.vectorizer = None
            self.doc_matrix = None
    
    def semantic_search(self, message: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Return top similar products for a message."""
        if not message or not self.vectorizer or self.doc_matrix is None:
            return []
        
        try:
            query_vec = self.vectorizer.transform([message])
            sims = cosine_similarity(query_vec, self.doc_matrix).flatten()
            if sims.size == 0:
                return []
            
            results: List[Dict[str, Any]] = []
            for idx in sims.argsort()[::-1][:top_k]:
                score = float(sims[idx])
                if score < 0.12:  # ignore weak matches
                    continue
                meta = self.doc_meta[idx]
                results.append({
                    "id": meta.get("id"),
                    "title": meta.get("title"),
                    "score": round(score, 3),
                    "snippet": meta.get("snippet")
                })
            return results
        except Exception as e:
            logger.debug(f"AIService semantic search error: {e}")
            return []

    def accelerator_search(self, message: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Use the optional C++ accelerator to rank docs quickly."""
        if not message or not getattr(self, "accelerator", None) or not self.doc_meta:
            return []

        try:
            ranked = self.accelerator.rank_documents(message, self.doc_meta, top_k=top_k)  # type: ignore[attr-defined]
            return [
                {
                    "id": r.id,
                    "title": r.title,
                    "score": r.score,
                    "snippet": r.snippet
                }
                for r in ranked
                if r.score >= 0.05
            ]
        except Exception as e:  # pragma: no cover - non-critical path
            logger.debug(f"Accelerator search failed: {e}")
            return []
    
    def get_context(self, db: DatabaseManager) -> Dict[str, Any]:
        """Get context information for response generation"""
        context = {}

        # During development the app can run without MySQL; skip DB context in that mode.
        if not db or not getattr(db, "_pool", None):
            return context
        
        try:
            # Get product count
            result = db.execute_query(
                "SELECT COUNT(*) as count FROM products WHERE status != 'draft'",
                fetch_one=True
            )
            context["product_count"] = result['count'] if result else 0
            
            # Get fabrication queue count
            result = db.execute_query(
                "SELECT COUNT(*) as count FROM fabrication_queue WHERE status IN ('pending', 'in_progress')",
                fetch_one=True
            )
            context["fabrication_count"] = result['count'] if result else 0
            
        except Exception as e:
            logger.debug(f"Failed to get AI context: {e}")
        
        return context
    
    async def process_message(
        self,
        message: str,
        db: Optional[DatabaseManager] = None
    ) -> Dict[str, Any]:
        """Process a chat message and generate response"""
        start_time = time.time()
        
        # Detect intent
        intent, confidence = self.detect_intent(message)
        
        # Get context if database is available
        context = {}
        if db:
            context = self.get_context(db)
        
        # Retrieval-augmented suggestion
        retrieval_results = self.semantic_search(message)
        used_retrieval = bool(retrieval_results)
        
        if used_retrieval and intent in {
            "unknown",
            "product_inquiry",
            "price_inquiry",
            "specification_inquiry",
            "stock_inquiry",
            "fabrication_inquiry"
        }:
            top = retrieval_results[0]
            bullets = "\n".join([
                f"- {r['title']} ({int(r['score'] * 100)}% match) — {r.get('snippet', '')}"
                for r in retrieval_results
            ])
            response = (
                "I scanned the catalog and found:\n"
                f"{bullets}\n\n"
                "Type `catalog` to browse, or `buy <id>` from the terminal to reserve an item."
            )
            intent = "product_recommendation"
            confidence = max(confidence, min(0.98, 0.55 + top["score"]))
        else:
            # Generate response from templates
            response = self.generate_response(message, intent, confidence, context)
        
        processing_time = (time.time() - start_time) * 1000
        
        return {
            "answer": response,
            "intent": intent,
            "confidence": round(confidence, 3),
            "processing_time_ms": round(processing_time, 2),
            "sources": retrieval_results,
            "used_retrieval": used_retrieval,
            "source": "ai_service"
        }

    async def process_message_fast(
        self,
        message: str,
        db: Optional[DatabaseManager] = None
    ) -> Dict[str, Any]:
        """Lower-latency path that prefers the native accelerator when available."""
        start_time = time.perf_counter()

        intent, confidence = self.detect_intent(message)
        context = self.get_context(db) if db else {}

        accel_hits = self.accelerator_search(message, top_k=4)
        retrieval_results = accel_hits or self.semantic_search(message, top_k=4)
        used_retrieval = bool(retrieval_results)

        response = self.generate_response(message, intent, confidence, context)

        if used_retrieval:
            bullets = "\n".join([
                f"- {r.get('title', r.get('id'))} ({int((r.get('score') or 0) * 100)}% match) "
                f"{(r.get('snippet') or '')}".strip()
                for r in retrieval_results
            ])
            response = (
                f"{response}\n\nRelevant matches:\n{bullets}\n"
                "Use `catalog`, `inspect <id>`, or `buy <id>` directly from the terminal."
            )
            confidence = max(confidence, 0.6)

        processing_time = (time.perf_counter() - start_time) * 1000

        return {
            "answer": response,
            "intent": intent,
            "confidence": round(confidence, 3),
            "processing_time_ms": round(processing_time, 2),
            "sources": retrieval_results,
            "used_retrieval": used_retrieval,
            "source": "fastpath",
            "accelerator": bool(accel_hits)
        }

# ============================================================================
