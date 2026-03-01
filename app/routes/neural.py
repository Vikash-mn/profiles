from __future__ import annotations

import json
import hashlib
import re
import time
import os
from datetime import datetime
from typing import Any, Dict, Optional, List
from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from app.config import Config, logger
from app.database import DatabaseManager
from app.dependencies import get_db

from app.services.neural_embedding import get_embedding_service

# Data file path
NEURAL_DATA_FILE = "neural_backup.json"

# Knowledge base storage
_knowledge_base: Dict[str, dict] = {}
_trained_patterns: List[dict] = []
_session_memories: Dict[str, List[dict]] = {}

# TF-IDF Vectorizer for semantic search
_tfidf_vectorizer = None
_tfidf_matrix = None
_knowledge_texts = []


@asynccontextmanager
async def lifespan(app):
    """Auto-save and auto-load training data on server startup/shutdown"""
    # STARTUP: Load training data from file
    await load_training_data_on_startup()
    yield
    # SHUTDOWN: Save training data to file
    await save_training_data_on_shutdown()


async def load_training_data_on_startup():
    """Load training data from file when server starts"""
    global _knowledge_base, _trained_patterns
    
    if os.path.exists(NEURAL_DATA_FILE):
        try:
            with open(NEURAL_DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Load knowledge base
            knowledge = data.get('knowledge_base', [])
            for entry in knowledge:
                query = entry.get('query', '')
                if query:
                    query_hash = hashlib.md5(query.lower().encode()).hexdigest()
                    _knowledge_base[query_hash] = entry
            
            # Update semantic index
            update_knowledge_index()
            
            logger.info(f"[NEURAL] Loaded {len(_knowledge_base)} training examples from {NEURAL_DATA_FILE}")
        except Exception as e:
            logger.error(f"[NEURAL] Failed to load training data: {e}")

async def save_training_data_on_shutdown():
    """Save training data to file when server stops"""
    global _knowledge_base
    
    try:
        export_data = {
            "version": "VA.1",
            "exported": int(datetime.now().timestamp() * 1000),
            "knowledge_base": list(_knowledge_base.values()),
            "training_count": len(_knowledge_base)
        }
        
        with open(NEURAL_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"[NEURAL] Saved {len(_knowledge_base)} training examples to {NEURAL_DATA_FILE}")
    except Exception as e:
        logger.error(f"[NEURAL] Failed to save training data: {e}")

# Create router with lifespan
router = APIRouter(prefix="/neural", tags=["Neural"])

# ============================================================================
# ADVANCED NEURAL CORE BACKEND IMPLEMENTATION
# ============================================================================

# ============================================================================
# ADVANCED NLP PROCESSORS
# ============================================================================

def initialize_nlp():
    """Initialize advanced NLP components"""
    global _tfidf_vectorizer
    
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        _tfidf_vectorizer = TfidfVectorizer(
            max_features=500,
            ngram_range=(1, 2),
            stop_words='english',
            min_df=1
        )
        logger.info("Advanced NLP initialized successfully")
    except ImportError:
        logger.warning("sklearn not available - using basic NLP")
        _tfidf_vectorizer = None


def advanced_intent_classification(query: str) -> Dict[str, Any]:
    """Advanced intent classification with confidence scores"""
    query_lower = query.lower()
    
    # Define intent patterns with weights
    intents = {
        "greeting": {
            "patterns": [r"\b(hi|hello|hey|greetings|howdy|hiya|good morning|good afternoon|good evening)\b"],
            "weight": 1.0
        },
        "product_inquiry": {
            "patterns": [r"\b(product|item|buy|purchase|shop|store|catalog|inventory)\b", 
                        r"\b(show|find|search|browse|looking for|need|want)\b"],
            "weight": 0.9
        },
        "price_inquiry": {
            "patterns": [r"\b(price|cost|how much|expensive|cheap|budget|affordable|deal|discount)\b",
                        r"\$\d+"],
            "weight": 0.85
        },
        "specification": {
            "patterns": [r"\b(specs?|specifications|features|details|technical|dimensions?|power|compatibility)\b"],
            "weight": 0.8
        },
        "stock_status": {
            "patterns": [r"\b(in stock|out of stock|available|unavailable|restock|backorder)\b"],
            "weight": 0.9
        },
        "order_status": {
            "patterns": [r"\b(order|shipping|delivery|track|arrived|shipped|processing)\b",
                        r"where'?s my"],
            "weight": 0.95
        },
        "clearance": {
            "patterns": [r"\b(clearance|restricted|access|permission|level \d+|classified|secret)\b"],
            "weight": 1.0
        },
        "fabrication": {
            "patterns": [r"\b(fabricat|manufactur|custom|pcb|circuit|assembly|project|forge)\b"],
            "weight": 0.9
        },
        "help": {
            "patterns": [r"\b(help|assist|support|guide|what can you do|capabilities)\b"],
            "weight": 1.0
        },
        "contact": {
            "patterns": [r"\b(contact|email|phone|reach|support|customer service|talk to human)\b"],
            "weight": 1.0
        },
        "farewell": {
            "patterns": [r"\b(bye|goodbye|see you|thanks|thank you|that'?s all)\b"],
            "weight": 1.0
        }
    }
    
    # Score each intent
    intent_scores = {}
    for intent, config in intents.items():
        score = 0
        for pattern in config["patterns"]:
            if re.search(pattern, query_lower):
                score += config["weight"]
        if score > 0:
            intent_scores[intent] = score
    
    # Get best intent
    if intent_scores:
        best_intent = max(intent_scores, key=intent_scores.get)
        confidence = min(0.99, intent_scores[best_intent] / sum(intent_scores.values()))
    else:
        best_intent = "general"
        confidence = 0.5
    
    return {
        "intent": best_intent,
        "confidence": confidence,
        "all_intents": intent_scores
    }


def advanced_sentiment_analysis(query: str) -> Dict[str, Any]:
    """Advanced sentiment analysis"""
    query_lower = query.lower()
    
    positive_words = [
        "love", "great", "awesome", "excellent", "amazing", "wonderful", "fantastic",
        "good", "happy", "pleased", "thanks", "thank", "helpful", "perfect", "best",
        "cool", "nice", "brilliant", "superb", "outstanding"
    ]
    
    negative_words = [
        "hate", "bad", "terrible", "awful", "horrible", "worst", "poor", "angry",
        "frustrated", "annoyed", "upset", "disappointed", "broken", "error", "problem",
        "issue", "fail", "failed", "useless", "stupid", "ridiculous"
    ]
    
    question_words = ["?", "how", "what", "why", "when", "where", "who", "which", "can", "could", "would"]
    
    positive_count = sum(1 for word in positive_words if word in query_lower)
    negative_count = sum(1 for word in negative_words if word in query_lower)
    question_count = sum(1 for word in question_words if word in query_lower)
    
    # Calculate sentiment
    if positive_count > negative_count:
        sentiment = "positive"
        score = min(0.99, 0.5 + (positive_count - negative_count) * 0.1)
    elif negative_count > positive_count:
        sentiment = "negative"
        score = max(0.01, 0.5 - (negative_count - positive_count) * 0.1)
    else:
        sentiment = "neutral"
        score = 0.5
    
    # Detect if question
    is_question = "?" in query or question_count > 0
    
    return {
        "sentiment": sentiment,
        "score": score,
        "positive_words": positive_count,
        "negative_words": negative_count,
        "is_question": is_question,
        "emotion": "curious" if is_question else sentiment
    }


def keyword_extraction(query: str) -> List[str]:
    """Extract important keywords from query"""
    # Remove stopwords
    stopwords = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
        'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
        'during', 'before', 'after', 'above', 'below', 'between', 'under',
        'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
        'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
        'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
        'very', 'just', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
        'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'and',
        'but', 'if', 'or', 'because', 'as', 'until', 'while', 'about', 'into'
    }
    
    # Extract words
    words = re.findall(r'\b[a-zA-Z]{3,}\b', query.lower())
    keywords = [w for w in words if w not in stopwords]
    
    # Get top keywords
    return list(set(keywords))[:5]


def semantic_search(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Semantic search using TF-IDF similarity"""
    global _tfidf_vectorizer, _tfidf_matrix, _knowledge_texts
    
    if not _knowledge_texts or _tfidf_vectorizer is None:
        return []
    
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        
        # Transform query
        query_vec = _tfidf_vectorizer.transform([query])
        
        # Calculate similarities
        similarities = cosine_similarity(query_vec, _tfidf_matrix).flatten()
        
        # Get top results
        top_indices = similarities.argsort()[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.1:
                results.append({
                    "index": idx,
                    "similarity": float(similarities[idx]),
                    "knowledge": _knowledge_texts[idx]
                })
        
        return results
    except Exception as e:
        logger.error(f"Semantic search error: {e}")
        return []


def update_knowledge_index():
    """Update the TF-IDF index when knowledge changes"""
    global _tfidf_vectorizer, _tfidf_matrix, _knowledge_texts
    
    if not _knowledge_base:
        return
    
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        
        # Prepare texts
        _knowledge_texts = [
            f"{entry.get('query', '')} {entry.get('response', '')}"
            for entry in _knowledge_base.values()
        ]
        
        if _knowledge_texts:
            _tfidf_vectorizer = TfidfVectorizer(
                max_features=500,
                ngram_range=(1, 2),
                stop_words='english'
            )
            _tfidf_matrix = _tfidf_vectorizer.fit_transform(_knowledge_texts)
            logger.info(f"Knowledge index updated with {len(_knowledge_texts)} entries")
    except Exception as e:
        logger.error(f"Knowledge index update error: {e}")


# ============================================================================
# RESPONSE GENERATOR
# ============================================================================

def generate_advanced_response(query: str, intent: str, context: Optional[Dict] = None) -> str:
    """Generate context-aware response"""
    
    # Check trained knowledge first
    query_hash = hashlib.md5(query.lower().encode()).hexdigest()
    if query_hash in _knowledge_base:
        entry = _knowledge_base[query_hash]
        return f"{entry['response']}"
    
    # Semantic search in knowledge base
    semantic_results = semantic_search(query)
    if semantic_results and semantic_results[0]["similarity"] > 0.5:
        return f"{semantic_results[0]['knowledge'].get('response', 'I found relevant information.')}"
    
    # Template responses by intent
    templates = {
        "greeting": [
            "Hello! Welcome to Vikash Hardware Store. How can I assist you today?",
            "Hi there! What can I help you find?",
            "Greetings! I'm here to help with products, orders, or technical questions."
        ],
        "product_inquiry": [
            "We have {product_count} products available. What category interests you?",
            "Our catalog includes development boards, sensors, and custom fabrication.",
            "I can help you find exactly what you need. What are you looking for?"
        ],
        "price_inquiry": [
            "Our products range from budget to premium. What's your budget range?",
            "Prices vary by product. Would you like me to show you options in a specific range?",
            "We offer competitive pricing. What type of product are you interested in?"
        ],
        "specification": [
            "Each product has detailed specifications on its page. Which item would you like to learn about?",
            "I can provide technical specs for any product. What are you researching?",
            "Our specifications are comprehensive. What details do you need?"
        ],
        "stock_status": [
            "Stock levels are updated in real-time. Most items ship within 24 hours.",
            "We maintain accurate inventory. Check product pages for availability.",
            "Some items may be in fabrication. Would you like to be notified when available?"
        ],
        "order_status": [
            "You can track orders in your purchase history. Need help with a specific order?",
            "Orders typically ship within 3-5 business days. What's your order number?",
            "I'd be happy to check your order status. Please provide your order number."
        ],
        "clearance": [
            "Certain products require elevated clearance. Contact administration for access.",
            "Restricted items need special permissions. Would you like to request access?",
            "Clearance levels are assigned based on verification. How can I assist?"
        ],
        "fabrication": [
            "Our Custom Forge service handles PCB design and fabrication. What's your project?",
            "Custom fabrication typically takes 5-10 business days. What do you need built?",
            "I can help with custom hardware projects. Describe your requirements."
        ],
        "help": [
            "I can help with: product searches, pricing, order status, specifications, and custom fabrication.",
            "Just ask naturally! I understand products, orders, and technical questions.",
            "What do you need help with today?"
        ],
        "contact": [
            "Email support@vikash.dev for assistance. We respond within 24 hours.",
            "Our team is available Monday-Friday, 9 AM - 6 PM EST.",
            "Need human support? Email support@vikash.dev"
        ],
        "farewell": [
            "Thank you for visiting! Feel free to return if you have more questions.",
            "Have a great day! Happy hardware hacking!",
            "Goodbye! Don't hesitate to reach out anytime."
        ]
    }
    
    import random
    template = templates.get(intent, templates.get("help", ["How can I help you?"]))
    
    return random.choice(template)


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class NeuralProcessRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = {}
    session_id: Optional[str] = "default"


class NeuralTrainRequest(BaseModel):
    input: str
    output: str
    metadata: Optional[Dict[str, Any]] = {}
    session_id: Optional[str] = "default"


class NeuralSyncRequest(BaseModel):
    session_id: str
    client_version: str
    local_stats: Optional[Dict[str, Any]] = {}
    pending_memories: Optional[List[Dict[str, Any]]] = []


class NeuralDataRequest(BaseModel):
    data: List[Dict[str, Any]]
    action: str  # "save" or "load"


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/system_status")
async def get_system_status():
    """Get neural core system status (also available at /neural/system_status)"""
    return {
        "status": "operational",
        "version": "VA.0",
        "backend": "online",
        "nlp": "advanced",
        "knowledge_entries": len(_knowledge_base),
        "trained_patterns": len(_trained_patterns),
        "active_sessions": len(_session_memories),
        "semantic_indexed": len(_knowledge_texts) if _knowledge_texts else 0,
        "timestamp": datetime.now().isoformat()
    }

# Alias at root level for frontend compatibility
@router.get("/")
async def root_system_status():
    """Root level system status for frontend compatibility"""
    return {
        "status": "operational",
        "version": "VA.0",
        "backend": "online",
        "nlp": "advanced",
        "knowledge_entries": len(_knowledge_base),
        "timestamp": datetime.now().isoformat()
    }
    return {
        "status": "operational",
        "version": "VA.0",
        "backend": "online",
        "nlp": "advanced",
        "knowledge_entries": len(_knowledge_base),
        "trained_patterns": len(_trained_patterns),
        "active_sessions": len(_session_memories),
        "semantic_indexed": len(_knowledge_texts) if _knowledge_texts else 0,
        "timestamp": datetime.now().isoformat()
    }


@router.post("/process")
async def process_neural_query(request: NeuralProcessRequest):
    """
    Advanced neural query processing with NLP.
    Includes intent classification, sentiment analysis, keyword extraction, and semantic search.
    """
    try:
        query = request.query
        session_id = request.session_id or "default"
        
        # Advanced NLP processing
        intent_result = advanced_intent_classification(query)
        sentiment_result = advanced_sentiment_analysis(query)
        keywords = keyword_extraction(query)
        
        intent = intent_result["intent"]
        emotion = sentiment_result["emotion"]
        
        # Generate response
        response = generate_advanced_response(query, intent, request.context)
        
        # Calculate confidence
        confidence = min(0.95, intent_result["confidence"] * 0.7 + sentiment_result["score"] * 0.3)
        
        # Semantic search for related knowledge
        semantic_results = semantic_search(query)
        
        # Store in session
        if session_id not in _session_memories:
            _session_memories[session_id] = []
        
        _session_memories[session_id].append({
            "query": query,
            "response": response,
            "intent": intent,
            "emotion": emotion,
            "confidence": confidence,
            "keywords": keywords,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep session manageable
        if len(_session_memories[session_id]) > 100:
            _session_memories[session_id] = _session_memories[session_id][-100:]
        
        return {
            "success": True,
            "answer": response,
            "intent": intent,
            "intent_confidence": intent_result["confidence"],
            "all_intents": intent_result["all_intents"],
            "sentiment": sentiment_result["sentiment"],
            "sentiment_score": sentiment_result["score"],
            "emotion": emotion,
            "keywords": keywords,
            "confidence": confidence,
            "semantic_matches": semantic_results[:2],
            "query_hash": hashlib.md5(query.lower().encode()).hexdigest(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Neural process error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train")
async def train_neural_memory(request: NeuralTrainRequest):
    """Train neural memory with new knowledge"""
    try:
        input_text = request.input
        output_text = request.output
        session_id = request.session_id or "default"
        metadata = request.metadata or {}
        
        # Create knowledge entry
        query_hash = hashlib.md5(input_text.lower().encode()).hexdigest()
        
        # Run NLP on input
        intent_result = advanced_intent_classification(input_text)
        sentiment_result = advanced_sentiment_analysis(input_text)
        keywords = keyword_extraction(input_text)
        
        knowledge_entry = {
            "query": input_text,
            "response": output_text,
            "intent": metadata.get("intent", intent_result["intent"]),
            "emotion": metadata.get("emotion", sentiment_result["emotion"]),
            "confidence": metadata.get("confidence", 0.9),
            "keywords": metadata.get("keywords", keywords),
            "context": metadata.get("context", {}),
            "tags": metadata.get("tags", []),
            "trained_at": datetime.now().isoformat(),
            "access_count": 0
        }
        
        # Store
        _knowledge_base[query_hash] = knowledge_entry
        
        # Track pattern
        _trained_patterns.append({
            "query_hash": query_hash,
            "session_id": session_id,
            "trained_at": datetime.now().isoformat()
        })
        
        # Update semantic index
        update_knowledge_index()
        
        # Keep manageable
        if len(_trained_patterns) > 1000:
            _trained_patterns = _trained_patterns[-500:]
        
        logger.info(f"Trained: {input_text[:50]}...")
        
        return {
            "success": True,
            "trained": True,
            "query_hash": query_hash,
            "intent": knowledge_entry["intent"],
            "keywords": keywords,
            "indexed": True,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Train error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync")
async def sync_knowledge(request: NeuralSyncRequest):
    """Sync knowledge with client"""
    try:
        session_id = request.session_id
        pending_memories = request.pending_memories or []
        
        # Merge memories
        merged = 0
        for memory in pending_memories:
            query = memory.get("query", "")
            if query:
                query_hash = hashlib.md5(query.lower().encode()).hexdigest()
                if query_hash not in _knowledge_base:
                    _knowledge_base[query_hash] = memory
                    merged += 1
        
        # Update index if new data
        if merged > 0:
            update_knowledge_index()
        
        return {
            "success": True,
            "synced": True,
            "session_id": session_id,
            "merged": merged,
            "total_entries": len(_knowledge_base),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/data")
async def manage_neural_data(request: NeuralDataRequest):
    """Save or load neural training data to/from file"""
    import os
    
    DATA_FILE = "neural_backup.json"
    
    try:
        action = request.action
        
        if action == "save":
            # Save training data to file
            data = request.data
            export_data = {
                "version": "VA.1",
                "exported": int(datetime.now().timestamp() * 1000),
                "knowledge_base": [
                    {"query": v["query"], "response": v["response"], **v}
                    for v in data
                ],
                "training_count": len(data)
            }
            
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            return {
                "success": True,
                "action": "saved",
                "entries": len(data),
                "file": DATA_FILE,
                "timestamp": datetime.now().isoformat()
            }
            
        elif action == "load":
            # Load training data from file
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    loaded_data = json.load(f)
                
                entries = loaded_data.get("knowledge_base", [])
                
                # Add to knowledge base
                for entry in entries:
                    query = entry.get("query", "")
                    if query:
                        query_hash = hashlib.md5(query.lower().encode()).hexdigest()
                        _knowledge_base[query_hash] = entry
                
                # Update semantic index
                if entries:
                    update_knowledge_index()
                
                return {
                    "success": True,
                    "action": "loaded",
                    "entries": len(entries),
                    "file": DATA_FILE,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "action": "load_failed",
                    "error": f"File not found: {DATA_FILE}",
                    "timestamp": datetime.now().isoformat()
                }
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'save' or 'load'")
            
    except Exception as e:
        logger.error(f"Data management error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics")
async def get_neural_metrics():
    """Get neural system metrics"""
    
    # Count by intent
    intent_counts = {}
    for entry in _knowledge_base.values():
        intent = entry.get("intent", "unknown")
        intent_counts[intent] = intent_counts.get(intent, 0) + 1
    
    return {
        "knowledge_base": {
            "total": len(_knowledge_base),
            "by_intent": intent_counts
        },
        "trained_patterns": len(_trained_patterns),
        "sessions": {
            "active": len(_session_memories),
            "total_memories": sum(len(m) for m in _session_memories.values())
        },
        "semantic_index": {
            "entries": len(_knowledge_texts),
            "vectorizer_ready": _tfidf_vectorizer is not None
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/knowledge")
async def get_knowledge_base():
    """Get all knowledge entries"""
    return {
        "knowledge": list(_knowledge_base.values()),
        "count": len(_knowledge_base),
        "timestamp": datetime.now().isoformat()
    }


@router.delete("/knowledge/{query_hash}")
async def delete_knowledge(query_hash: str):
    """Delete knowledge entry"""
    if query_hash in _knowledge_base:
        del _knowledge_base[query_hash]
        update_knowledge_index()
        return {"success": True, "remaining": len(_knowledge_base)}
    else:
        raise HTTPException(status_code=404, detail="Entry not found")


@router.post("/clear")
async def clear_neural_memory():
    """Clear all neural memory"""
    global _knowledge_base, _trained_patterns, _session_memories, _knowledge_texts
    
    cleared = len(_knowledge_base)
    _knowledge_base = {}
    _trained_patterns = []
    _session_memories = {}
    _knowledge_texts = []
    
    return {
        "success": True,
        "cleared_entries": cleared,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/health")
async def neural_health():
    """Health check"""
    return {
        "status": "healthy",
        "service": "neural-core-advanced",
        "version": "VA.0",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/model-info")
async def get_model_info():
    """
    Get Neural Model Information
    ============================
    Returns the model architecture and parameter count
    Auto-detects GPU and scales model accordingly
    """
    try:
        embedding_service = get_embedding_service()
        model_info = embedding_service.get_info()
        
        return {
            "success": True,
            "hardware": {
                "detected": model_info.get('hardware', 'Unknown'),
                "gpu_available": model_info.get('gpu_available', False),
                "auto_scaling": True
            },
            "model": {
                "name": "Neural Text Embedding",
                "type": model_info['architecture'],
                "backend": model_info.get('backend', 'numpy'),
                "device": model_info.get('device', 'cpu'),
                "parameters": {
                    "total": model_info['total_parameters'],
                    "vocabulary": model_info['config']['vocab_size'],
                    "embedding_dim": model_info['config']['embed_dim'],
                    "hidden_dim": model_info['config']['hidden_dim']
                },
                "config": {
                    "vocabulary_size": model_info['config']['vocab_size'],
                    "embedding_dimension": model_info['config']['embed_dim'],
                    "hidden_dimension": model_info['config']['hidden_dim'],
                    "lstm_layers": model_info['config']['num_layers'],
                    "max_sequence_length": model_info['config']['max_length']
                },
                "scaling": {
                    "gpu_mode": model_info['config']['vocab_size'] >= 50000,
                    "cpu_mode": 10000 <= model_info['config']['vocab_size'] < 50000,
                    "light_mode": model_info['config']['vocab_size'] < 10000
                }
            },
            "initialized": model_info['initialized']
        }
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        return {
            "success": False,
            "error": str(e)
        }


# Legacy endpoints
@router.post("/sync_knowledge")
async def legacy_sync(request: Request):
    """Legacy sync"""
    try:
        body = await request.json()
        return {"success": True, "synced": True, "session_id": body.get("session_id")}
    except:
        return {"success": False}


@router.post("/train_memory")
async def legacy_train(request: Request):
    """Legacy train"""
    try:
        body = await request.json()
        input_text = body.get("input", "")
        output_text = body.get("output", "")
        
        query_hash = hashlib.md5(input_text.lower().encode()).hexdigest()
        _knowledge_base[query_hash] = {
            "query": input_text,
            "response": output_text,
            "trained_at": datetime.now().isoformat()
        }
        
        return {"success": True, "trained": True}
    except:
        return {"success": False}


# Feedback endpoint for reinforcement learning
_feedback_history: List[Dict] = []

# Initialize at module level
initialize_nlp()

@router.post("/feedback")
async def receive_feedback(request: Request):
    """Receive user feedback on responses for reinforcement learning"""
    try:
        body = await request.json()
        query = body.get("query", "")
        rating = body.get("rating", 3)  # 1-5 scale
        feedback_data = body.get("feedback", {})
        
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()
        
        # Store feedback
        feedback_entry = {
            "query_hash": query_hash,
            "query": query,
            "rating": rating,
            "feedback": feedback_data,
            "timestamp": datetime.now().isoformat()
        }
        _feedback_history.append(feedback_entry)
        
        # Update knowledge base confidence if corrected response provided
        if feedback_data.get("correctedResponse") and query_hash in _knowledge_base:
            _knowledge_base[query_hash]["response"] = feedback_data["correctedResponse"]
            _knowledge_base[query_hash]["improved_at"] = datetime.now().isoformat()
        
        # Adjust confidence based on rating
        if query_hash in _knowledge_base:
            current_conf = _knowledge_base[query_hash].get("confidence", 0.8)
            rating_factor = (rating - 3) / 10  # -0.2 to +0.2
            _knowledge_base[query_hash]["confidence"] = max(0.1, min(1.0, current_conf + rating_factor))
        
        # Keep feedback history manageable (just truncate in place)
        if len(_feedback_history) > 500:
            del _feedback_history[:-250]
        
        return {
            "success": True, 
            "feedback_received": True,
            "rating": rating,
            "knowledge_updated": query_hash in _knowledge_base
        }
        
    except Exception as e:
        logger.error(f"Feedback error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/feedback/stats")
async def get_feedback_stats():
    """Get feedback statistics"""
    if not _feedback_history:
        return {"total": 0, "average_rating": 0, "ratings_dist": {}}
    
    ratings = [f["rating"] for f in _feedback_history]
    ratings_dist = {i: ratings.count(i) for i in range(1, 6)}
    
    return {
        "total": len(_feedback_history),
        "average_rating": sum(ratings) / len(ratings) if ratings else 0,
        "ratings_distribution": ratings_dist,
        "recent_feedback": _feedback_history[-10:] if _feedback_history else []
    }


# ============================================================================
# ADMIN FUNCTIONS
# ============================================================================

class NeuralAdminRequest(BaseModel):
    """Admin operation request"""
    action: str
    params: Optional[Dict[str, Any]] = {}


class NeuralBulkDeleteRequest(BaseModel):
    """Bulk delete request"""
    query_hashes: List[str]


class NeuralExportRequest(BaseModel):
    """Export request"""
    format: str = "json"  # json, csv
    include_sessions: bool = False


class NeuralImportRequest(BaseModel):
    """Import request"""
    data: List[Dict[str, Any]]
    merge: bool = True  # True = merge with existing, False = replace


class NeuralSessionManageRequest(BaseModel):
    """Session management request"""
    session_id: str
    action: str  # view, clear, export


@router.post("/admin/bulk-delete")
async def bulk_delete_knowledge(request: NeuralBulkDeleteRequest):
    """Bulk delete knowledge entries by query hashes"""
    global _knowledge_base, _knowledge_texts
    
    deleted_count = 0
    failed_hashes = []
    
    for query_hash in request.query_hashes:
        if query_hash in _knowledge_base:
            del _knowledge_base[query_hash]
            deleted_count += 1
        else:
            failed_hashes.append(query_hash)
    
    # Rebuild semantic index
    update_knowledge_index()
    
    return {
        "success": True,
        "deleted": deleted_count,
        "failed": failed_hashes,
        "remaining": len(_knowledge_base),
        "timestamp": datetime.now().isoformat()
    }


@router.post("/admin/export")
async def export_neural_data(request: NeuralExportRequest):
    """Export neural data (knowledge base, sessions, patterns)"""
    export_data = {
        "version": "VA.1",
        "exported": datetime.now().isoformat(),
        "knowledge_base": list(_knowledge_base.values()),
        "training_count": len(_knowledge_base),
        "trained_patterns": _trained_patterns
    }
    
    if request.include_sessions:
        export_data["sessions"] = _session_memories
    
    if request.format == "csv":
        # Convert to CSV format for knowledge base
        csv_lines = ["query,intent,response,confidence,timestamp"]
        for entry in _knowledge_base.values():
            row = f"\"{entry.get('query', '')}\",\"{entry.get('intent', '')}\",\"{entry.get('response', '')}\",{entry.get('confidence', 0)},{entry.get('timestamp', '')}"
            csv_lines.append(row)
        return {
            "format": "csv",
            "data": "\n".join(csv_lines),
            "count": len(_knowledge_base)
        }
    
    return {
        "success": True,
        "format": "json",
        "data": export_data,
        "timestamp": datetime.now().isoformat()
    }


@router.post("/admin/import")
async def import_neural_data(request: NeuralImportRequest):
    """Import neural data (knowledge base entries)"""
    global _knowledge_base, _trained_patterns
    
    imported_count = 0
    skipped_count = 0
    
    for entry in request.data:
        query = entry.get('query', '')
        if not query:
            skipped_count += 1
            continue
            
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()
        
        if request.merge:
            # Merge with existing - update if newer
            if query_hash in _knowledge_base:
                existing = _knowledge_base[query_hash]
                existing_ts = existing.get('timestamp', 0)
                new_ts = entry.get('timestamp', 0)
                if new_ts > existing_ts:
                    _knowledge_base[query_hash] = entry
                    imported_count += 1
                else:
                    skipped_count += 1
            else:
                _knowledge_base[query_hash] = entry
                imported_count += 1
        else:
            # Replace mode
            _knowledge_base[query_hash] = entry
            imported_count += 1
    
    # Rebuild semantic index
    update_knowledge_index()
    
    return {
        "success": True,
        "imported": imported_count,
        "skipped": skipped_count,
        "total_knowledge": len(_knowledge_base),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/admin/sessions")
async def list_sessions():
    """List all active sessions"""
    sessions_summary = []
    
    for session_id, memories in _session_memories.items():
        sessions_summary.append({
            "session_id": session_id,
            "memory_count": len(memories),
            "last_activity": memories[-1].get('timestamp') if memories else None
        })
    
    return {
        "success": True,
        "sessions": sessions_summary,
        "total_sessions": len(_session_memories),
        "total_memories": sum(len(m) for m in _session_memories.values()),
        "timestamp": datetime.now().isoformat()
    }


@router.post("/admin/session/manage")
async def manage_session(request: NeuralSessionManageRequest):
    """Manage a specific session (view, clear, export)"""
    
    if request.session_id not in _session_memories:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_memories = _session_memories[request.session_id]
    
    if request.action == "view":
        return {
            "success": True,
            "session_id": request.session_id,
            "memories": session_memories,
            "count": len(session_memories)
        }
    
    elif request.action == "export":
        return {
            "success": True,
            "session_id": request.session_id,
            "data": session_memories,
            "count": len(session_memories)
        }
    
    elif request.action == "clear":
        cleared_count = len(session_memories)
        _session_memories[request.session_id] = []
        return {
            "success": True,
            "session_id": request.session_id,
            "cleared": cleared_count
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use: view, export, or clear")


@router.get("/admin/analytics")
async def get_analytics():
    """Get detailed analytics on knowledge base"""
    
    # Analyze intents
    intent_stats = {}
    for entry in _knowledge_base.values():
        intent = entry.get("intent", "unknown")
        if intent not in intent_stats:
            intent_stats[intent] = {"count": 0, "total_confidence": 0}
        intent_stats[intent]["count"] += 1
        intent_stats[intent]["total_confidence"] += entry.get("confidence", 0)
    
    # Calculate average confidence per intent
    for intent in intent_stats:
        count = intent_stats[intent]["count"]
        if count > 0:
            intent_stats[intent]["avg_confidence"] = intent_stats[intent]["total_confidence"] / count
        del intent_stats[intent]["total_confidence"]
    
    # Query length analysis
    query_lengths = [len(entry.get("query", "")) for entry in _knowledge_base.values()]
    avg_query_length = sum(query_lengths) / len(query_lengths) if query_lengths else 0
    
    # Recent entries (last 10)
    sorted_entries = sorted(_knowledge_base.values(), 
                          key=lambda x: x.get("timestamp", 0), 
                          reverse=True)[:10]
    
    return {
        "success": True,
        "overview": {
            "total_knowledge": len(_knowledge_base),
            "total_patterns": len(_trained_patterns),
            "total_sessions": len(_session_memories),
            "semantic_entries": len(_knowledge_texts)
        },
        "intents": intent_stats,
        "query_analysis": {
            "avg_length": round(avg_query_length, 2),
            "min_length": min(query_lengths) if query_lengths else 0,
            "max_length": max(query_lengths) if query_lengths else 0
        },
        "recent_entries": sorted_entries,
        "timestamp": datetime.now().isoformat()
    }


@router.post("/admin/optimize")
async def optimize_knowledge_base():
    """Optimize knowledge base by removing duplicates and rebuilding index"""
    global _knowledge_base, _knowledge_texts
    
    original_count = len(_knowledge_base)
    
    # Remove duplicate queries (keep most recent)
    unique_entries = {}
    for query_hash, entry in _knowledge_base.items():
        query = entry.get("query", "")
        if query not in unique_entries:
            unique_entries[query] = entry
        else:
            # Keep the one with higher confidence
            existing = unique_entries[query]
            if entry.get("confidence", 0) > existing.get("confidence", 0):
                unique_entries[query] = entry
    
    # Rebuild hash index
    _knowledge_base = {}
    for entry in unique_entries.values():
        query = entry.get("query", "")
        query_hash = hashlib.md5(query.lower().encode()).hexdigest()
        _knowledge_base[query_hash] = entry
    
    # Rebuild semantic index
    update_knowledge_index()
    
    optimized_count = original_count - len(_knowledge_base)
    
    return {
        "success": True,
        "original_count": original_count,
        "optimized_count": len(_knowledge_base),
        "removed_duplicates": optimized_count,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/admin/config")
async def get_neural_config():
    """Get current neural system configuration"""
    return {
        "success": True,
        "config": {
            "max_features": 500,
            "ngram_range": [1, 2],
            "stop_words": "english",
            "min_df": 1,
            "vectorizer_enabled": _tfidf_vectorizer is not None,
            "knowledge_base_size": len(_knowledge_base),
            "max_session_memories": 1000
        },
        "timestamp": datetime.now().isoformat()
    }


@router.post("/admin/backup")
async def create_backup():
    """Create a backup of all neural data"""
    try:
        backup_data = {
            "version": "VA.1",
            "backup_time": datetime.now().isoformat(),
            "knowledge_base": list(_knowledge_base.values()),
            "trained_patterns": _trained_patterns,
            "sessions": _session_memories,
            "stats": {
                "knowledge_count": len(_knowledge_base),
                "patterns_count": len(_trained_patterns),
                "sessions_count": len(_session_memories)
            }
        }
        
        # Save to backup file
        backup_file = f"neural_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)
        
        return {
            "success": True,
            "backup_file": backup_file,
            "entries_backed_up": len(_knowledge_base),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Backup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/restore")
async def restore_backup(request: Request):
    """Restore neural data from a backup file"""
    try:
        body = await request.json()
        backup_file = body.get("file")
        
        if not backup_file or not os.path.exists(backup_file):
            raise HTTPException(status_code=404, detail="Backup file not found")
        
        with open(backup_file, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
        
        # Restore knowledge base
        global _knowledge_base, _trained_patterns, _session_memories
        
        knowledge = backup_data.get('knowledge_base', [])
        _knowledge_base = {}
        for entry in knowledge:
            query = entry.get('query', '')
            if query:
                query_hash = hashlib.md5(query.lower().encode()).hexdigest()
                _knowledge_base[query_hash] = entry
        
        _trained_patterns = backup_data.get('trained_patterns', [])
        _session_memories = backup_data.get('sessions', {})
        
        # Rebuild index
        update_knowledge_index()
        
        return {
            "success": True,
            "restored_knowledge": len(_knowledge_base),
            "restored_patterns": len(_trained_patterns),
            "restored_sessions": len(_session_memories),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Restore error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



