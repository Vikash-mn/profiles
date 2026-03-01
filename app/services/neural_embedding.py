"""
Neural Embedding System
=======================
Lightweight neural network for text embeddings
Designed for CPU-only execution with minimal memory footprint

Model Architecture:
- Vocabulary: 10,000 words
- Embedding Dimension: 64 (small for CPU efficiency)
- Hidden Layer: 128 neurons
- Output: 64-dimensional embeddings

Total Parameters: ~650K
"""

import os
import pickle
import numpy as np

# Try to import torch, but make it optional
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    
    # Auto-detect GPU availability
    TORCH_AVAILABLE = True
    try:
        GPU_AVAILABLE = torch.cuda.is_available()
        if GPU_AVAILABLE:
            DEVICE = torch.device('cuda')
            print(f"[INFO] GPU detected: {torch.cuda.get_device_name(0)}")
        else:
            DEVICE = torch.device('cpu')
            print("[INFO] Running on CPU")
    except:
        DEVICE = torch.device('cpu')
        GPU_AVAILABLE = False
except ImportError:
    TORCH_AVAILABLE = False
    GPU_AVAILABLE = False
    DEVICE = None
    print("[WARNING] PyTorch not available, using NumPy fallback")

from typing import List, Tuple, Optional
from collections import Counter
import re

class Vocabulary:
    """Simple vocabulary for word-level tokenization"""
    
    def __init__(self, vocab_size: int = 10000):
        self.vocab_size = vocab_size
        self.word2idx = {'<PAD>': 0, '<UNK>': 1}
        self.idx2word = {0: '<PAD>', 1: '<UNK>'}
        self.word_counts = Counter()
        self._idx = 2
    
    def build_vocab(self, texts: List[str], min_freq: int = 2):
        """Build vocabulary from texts"""
        # Tokenize
        for text in texts:
            words = self.tokenize(text)
            self.word_counts.update(words)
        
        # Add words meeting frequency threshold
        for word, count in self.word_counts.most_common():
            if count >= min_freq and self._idx < self.vocab_size:
                self.word2idx[word] = self._idx
                self.idx2word[self._idx] = word
                self._idx += 1
        
        print(f"[VOCAB] Built vocabulary with {len(self.word2idx)} words")
    
    def tokenize(self, text: str) -> List[str]:
        """Simple tokenization"""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return text.split()
    
    def encode(self, text: str, max_len: int = 50) -> np.ndarray:
        """Encode text to indices"""
        tokens = self.tokenize(text)[:max_len]
        indices = [self.word2idx.get(w, self.word2idx['<UNK>']) for w in tokens]
        
        # Pad or truncate
        if len(indices) < max_len:
            indices += [self.word2idx['<PAD>']] * (max_len - len(indices))
        
        return np.array(indices)
    
    def decode(self, indices: np.ndarray) -> str:
        """Decode indices to text"""
        words = []
        for idx in indices:
            if idx == 0:  # PAD
                continue
            word = self.idx2word.get(idx, '<UNK>')
            words.append(word)
        return ' '.join(words)


class Vocabulary:
    """Simple vocabulary for word-level tokenization"""
    
    def __init__(self, vocab_size: int = 10000):
        self.vocab_size = vocab_size
        self.word2idx = {'<PAD>': 0, '<UNK>': 1}
        self.idx2word = {0: '<PAD>', 1: '<UNK>'}
        self.word_counts = Counter()
        self._idx = 2
    
    def build_vocab(self, texts: List[str], min_freq: int = 2):
        """Build vocabulary from texts"""
        # Tokenize
        for text in texts:
            words = self.tokenize(text)
            self.word_counts.update(words)
        
        # Add words meeting frequency threshold
        for word, count in self.word_counts.most_common():
            if count >= min_freq and self._idx < self.vocab_size:
                self.word2idx[word] = self._idx
                self.idx2word[self._idx] = word
                self._idx += 1
        
        print(f"[VOCAB] Built vocabulary with {len(self.word2idx)} words")
    
    def tokenize(self, text: str) -> List[str]:
        """Simple tokenization"""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return text.split()
    
    def encode(self, text: str, max_len: int = 50) -> np.ndarray:
        """Encode text to indices"""
        tokens = self.tokenize(text)[:max_len]
        indices = [self.word2idx.get(w, self.word2idx['<UNK>']) for w in tokens]
        
        # Pad or truncate
        if len(indices) < max_len:
            indices += [self.word2idx['<PAD>']] * (max_len - len(indices))
        
        return np.array(indices)
    
    def decode(self, indices: np.ndarray) -> str:
        """Decode indices to text"""
        words = []
        for idx in indices:
            if idx == 0:  # PAD
                continue
            word = self.idx2word.get(idx, '<UNK>')
            words.append(word)
        return ' '.join(words)


if TORCH_AVAILABLE:
    class NeuralTextEmbedding(nn.Module):
        """
        Lightweight Neural Text Embedding Model (PyTorch)
        =================================================
        Architecture:
        - Embedding Layer: (vocab_size, embed_dim)
        - LSTM Layer: Bidirectional
        - FC Layer: Fully Connected layers
        
        Total Trainable Parameters: ~700K-3M (scales with hardware)
        """
        
        def __init__(self, vocab_size: int = 10000, embed_dim: int = 64, 
                     hidden_dim: int = 64, num_layers: int = 1, dropout: float = 0.2):
            super().__init__()
            
            # Store config
            self.vocab_size = vocab_size
            self.embed_dim = embed_dim
            self.hidden_dim = hidden_dim
            self.num_layers = num_layers
            self.device = DEVICE  # Auto-detected device
            
            # Embedding layer
            self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
            
            # LSTM for sequence processing
            self.lstm = nn.LSTM(
                embed_dim, 
                hidden_dim, 
                num_layers=num_layers,
                batch_first=True,
                dropout=dropout if num_layers > 1 else 0,
                bidirectional=True
            )
            
            # Fully connected layers
            self.fc = nn.Sequential(
                nn.Linear(hidden_dim * 2, hidden_dim),  # *2 for bidirectional
                nn.Tanh(),
                nn.Dropout(dropout),
                nn.Linear(hidden_dim, embed_dim)
            )
            
            # Move to device (GPU if available)
            self.to(self.device)
            
            # Count parameters
            self._count_parameters()
        
        def _count_parameters(self):
            """Count and display model parameters"""
            total = sum(p.numel() for p in self.parameters())
            trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
            
            # Breakdown
            embedding_params = self.embedding.numel()
            lstm_params = sum(p.numel() for p in self.lstm.parameters())
            fc_params = sum(p.numel() for p in self.fc.parameters())
            
            self.param_count = {
                'total': total,
                'trainable': trainable,
                'embedding': embedding_params,
                'lstm': lstm_params,
                'fc': fc_params,
                'vocab_size': self.vocab_size,
                'embed_dim': self.embed_dim,
                'hidden_dim': self.hidden_dim,
                'layers': self.num_layers,
                'device': str(self.device)
            }
            
            print(f"\n{'='*50}")
            print("NEURAL EMBEDDING MODEL PARAMETERS (PyTorch)")
            print(f"{'='*50}")
            print(f"  Device: {self.device}")
            print(f"  Embedding Layer: {embedding_params:,}")
            print(f"  LSTM Layer:      {lstm_params:,}")
            print(f"  FC Layer:        {fc_params:,}")
            print(f"{'='*50}")
            print(f"  TOTAL:           {total:,}")
            print(f"{'='*50}\n")
        
        def forward(self, x: torch.Tensor) -> torch.Tensor:
            """
            Forward pass
            Input: (batch_size, seq_len)
            Output: (batch_size, embed_dim)
            """
            # Move input to device
            x = x.to(self.device)
            
            # Embedding
            embedded = self.embedding(x)  # (batch, seq_len, embed_dim)
            
            # LSTM
            lstm_out, (hidden, cell) = self.lstm(embedded)
            
            # Concatenate final forward and backward hidden states
            hidden_concat = torch.cat((hidden[-2, :, :], hidden[-1, :, :]), dim=1)
            
            # FC layers
            output = self.fc(hidden_concat)
            
            return output
        
        def get_embedding(self, text: str, vocab: Vocabulary) -> np.ndarray:
            """Get embedding for a single text"""
            self.eval()
            with torch.no_grad():
                indices = vocab.encode(text)
                tensor = torch.tensor(indices).unsqueeze(0)
                embedding = self.forward(tensor)
                return embedding.cpu().squeeze(0).numpy()
else:
    # NumPy fallback implementation
    class NeuralTextEmbedding:
        """
        NumPy Fallback: Simple Embedding Model
        =======================================
        Uses random embeddings and simple averaging
        Total Parameters: ~640,000 (embeddings only)
        """
        
        def __init__(self, vocab_size: int = 10000, embed_dim: int = 64, 
                     hidden_dim: int = 64, num_layers: int = 1, dropout: float = 0.2):
            self.vocab_size = vocab_size
            self.embed_dim = embed_dim
            self.hidden_dim = hidden_dim
            
            # Initialize random embeddings (these count as parameters!)
            np.random.seed(42)
            self.embeddings = np.random.randn(vocab_size, embed_dim).astype(np.float32) * 0.1
            
            # Initialize hidden weights (simple projection)
            self.hidden_weights = np.random.randn(embed_dim, hidden_dim).astype(np.float32) * 0.1
            self.hidden_bias = np.zeros(hidden_dim, dtype=np.float32)
            
            # Output projection
            self.output_weights = np.random.randn(hidden_dim, embed_dim).astype(np.float32) * 0.1
            self.output_bias = np.zeros(embed_dim, dtype=np.float32)
            
            # Count parameters
            self.param_count = {
                'total': vocab_size * embed_dim + hidden_dim * embed_dim + hidden_dim + embed_dim * hidden_dim + embed_dim,
                'trainable': vocab_size * embed_dim + hidden_dim * embed_dim + hidden_dim + embed_dim * hidden_dim + embed_dim,
                'embedding': vocab_size * embed_dim,
                'hidden': hidden_dim * embed_dim + hidden_dim,
                'output': embed_dim * hidden_dim + embed_dim,
                'vocab_size': vocab_size,
                'embed_dim': embed_dim,
                'hidden_dim': hidden_dim,
                'layers': 1
            }
            
            print(f"\n{'='*50}")
            print("NEURAL EMBEDDING MODEL PARAMETERS (NumPy Fallback)")
            print(f"{'='*50}")
            print(f"  Embedding Layer: {vocab_size * embed_dim:,}")
            print(f"  Hidden Layer:    {hidden_dim * embed_dim + hidden_dim:,}")
            print(f"  Output Layer:    {embed_dim * hidden_dim + embed_dim:,}")
            print(f"{'='*50}")
            print(f"  TOTAL:           {self.param_count['total']:,}")
            print(f"{'='*50}\n")
        
        def forward(self, x: np.ndarray) -> np.ndarray:
            """Simple forward pass with mean pooling"""
            # x shape: (batch, seq_len)
            batch_size = x.shape[0]
            
            # Get embeddings
            embeddings = []
            for i in range(batch_size):
                seq_emb = []
                for idx in x[i]:
                    if idx < self.vocab_size:
                        seq_emb.append(self.embeddings[idx])
                    else:
                        seq_emb.append(np.zeros(self.embed_dim))
                
                if seq_emb:
                    # Mean pooling
                    emb = np.mean(seq_emb, axis=0)
                else:
                    emb = np.zeros(self.embed_dim)
                
                embeddings.append(emb)
            
            embeddings = np.array(embeddings)
            
            # Hidden layer
            hidden = np.tanh(np.dot(embeddings, self.hidden_weights) + self.hidden_bias)
            
            # Output layer
            output = np.dot(hidden, self.output_weights) + self.output_bias
            
            return output
        
        def get_embedding(self, text: str, vocab: Vocabulary) -> np.ndarray:
            """Get embedding for a single text"""
            indices = vocab.encode(text)
            tensor = indices.reshape(1, -1)
            return self.forward(tensor).squeeze(0)


class NeuralEmbeddingService:
    """
    Neural Embedding Service
    ========================
    Manages the neural embedding model and provides inference
    """
    
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
        
        # Auto-detect hardware and scale model accordingly
        if TORCH_AVAILABLE and GPU_AVAILABLE:
            # GPU detected - use larger model for better performance
            self.config = {
                'vocab_size': 50000,      # Larger vocabulary
                'embed_dim': 256,         # Larger embeddings
                'hidden_dim': 256,        # Larger hidden layer
                'num_layers': 2,          # More layers
                'dropout': 0.3,
                'max_length': 128
            }
            self.device_name = 'GPU'
        elif TORCH_AVAILABLE:
            # CPU only - medium model
            self.config = {
                'vocab_size': 20000,
                'embed_dim': 128,
                'hidden_dim': 128,
                'num_layers': 1,
                'dropout': 0.2,
                'max_length': 64
            }
            self.device_name = 'CPU'
        else:
            # NumPy fallback - small model for compatibility
            self.config = {
                'vocab_size': 10000,
                'embed_dim': 64,
                'hidden_dim': 64,
                'num_layers': 1,
                'dropout': 0.2,
                'max_length': 50
            }
            self.device_name = 'CPU (NumPy)'
        
        # Calculate total parameters
        self.total_params = self._calculate_params()
        
        # Initialize model and vocabulary (lazy loading)
        self.model = None
        self.vocab = None
        self.backend = 'pytorch' if TORCH_AVAILABLE else 'numpy'
        self.device = DEVICE if TORCH_AVAILABLE else None
        
        print(f"\n{'='*60}")
        print("NEURAL EMBEDDING SYSTEM INITIALIZED")
        print(f"{'='*60}")
        print(f"  Hardware: {self.device_name}")
        print(f"  Backend: {self.backend.upper()}")
        print(f"  Model Parameters: {self.total_params:,}")
        print(f"  Device: {self.device or 'N/A'}")
        print(f"  Embedding Dim: {self.config['embed_dim']}")
        print(f"{'='*60}\n")
        print(f"  Model Parameters: {self.total_params:,}")
        print(f"  Device: CPU (optimized for low RAM)")
        print(f"  Embedding Dim: {self.config['embed_dim']}")
        print(f"{'='*60}\n")
    
    def _calculate_params(self) -> int:
        """Calculate total model parameters"""
        vocab_size = self.config['vocab_size']
        embed_dim = self.config['embed_dim']
        hidden_dim = self.config['hidden_dim']
        num_layers = self.config['num_layers']
        
        # Embedding: vocab_size * embed_dim
        embedding_params = vocab_size * embed_dim
        
        # LSTM: 4 * num_layers * hidden_dim * (embed_dim + hidden_dim)
        lstm_params = 4 * num_layers * hidden_dim * (embed_dim + hidden_dim)
        
        # Bidirectional LSTM
        lstm_params *= 2
        
        # FC: (hidden_dim * 2 * hidden_dim) + (hidden_dim * embed_dim) + biases
        fc_params = (hidden_dim * 2 * hidden_dim) + hidden_dim + (hidden_dim * embed_dim) + embed_dim
        
        return embedding_params + lstm_params + fc_params
    
    def initialize(self, training_texts: Optional[List[str]] = None):
        """Initialize model and vocabulary"""
        # Create vocabulary
        self.vocab = Vocabulary(vocab_size=self.config['vocab_size'])
        
        if training_texts:
            # Build vocabulary from training data
            self.vocab.build_vocab(training_texts, min_freq=1)
        
        # Create model based on available backend
        if TORCH_AVAILABLE:
            self.model = NeuralTextEmbedding(
                vocab_size=len(self.vocab.word2idx),
                embed_dim=self.config['embed_dim'],
                hidden_dim=self.config['hidden_dim'],
                num_layers=self.config['num_layers'],
                dropout=self.config['dropout']
            )
        else:
            # Use NumPy fallback
            self.model = NeuralTextEmbedding(
                vocab_size=len(self.vocab.word2idx),
                embed_dim=self.config['embed_dim'],
                hidden_dim=self.config['hidden_dim']
            )
        
        # Print parameter breakdown
        self.total_params = self.model.param_count['total']
        print(f"\n[MODEL] Neural Network Parameters: {self.total_params:,}")
        print(f"[MODEL] Vocabulary Size: {len(self.vocab.word2idx):,}")
    
    def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for text"""
        if self.model is None:
            # Initialize with default texts if not initialized
            self.initialize([
                "product", "price", "order", "shipping", "payment",
                "hello", "help", "thank you", "goodbye"
            ])
        
        return self.model.get_embedding(text, self.vocab)
    
    def get_embeddings_batch(self, texts: List[str]) -> np.ndarray:
        """Get embeddings for multiple texts"""
        if self.model is None:
            self.initialize(texts)
        
        embeddings = []
        for text in texts:
            emb = self.get_embedding(text)
            embeddings.append(emb)
        
        return np.array(embeddings)
    
    def get_info(self) -> dict:
        """Get model information"""
        return {
            'total_parameters': self.total_params,
            'config': self.config,
            'model_type': 'Neural Text Embedding',
            'architecture': 'BiLSTM + FC' if TORCH_AVAILABLE else 'Simple Feedforward',
            'backend': self.backend,
            'device': str(self.device) if self.device else 'numpy',
            'hardware': self.device_name if hasattr(self, 'device_name') else 'Unknown',
            'gpu_available': GPU_AVAILABLE if TORCH_AVAILABLE else False,
            'initialized': self.model is not None
        }


# Singleton instance
_embedding_service = None

def get_embedding_service() -> NeuralEmbeddingService:
    """Get the singleton embedding service"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = NeuralEmbeddingService()
    return _embedding_service


# For testing
if __name__ == '__main__':
    service = get_embedding_service()
    service.initialize([
        "I want to buy a microcontroller",
        "What is the price of this product",
        "How long does shipping take",
        "Do you accept credit cards",
        "Can you help me with my order"
    ])
    
    # Test embedding
    test_text = "I need a raspberry pi for my project"
    embedding = service.get_embedding(test_text)
    
    print(f"\n[TEST] Input: '{test_text}'")
    print(f"[TEST] Embedding shape: {embedding.shape}")
    print(f"[TEST] Embedding sample: {embedding[:5]}")
    
    info = service.get_info()
    print(f"\n[INFO] {info}")
