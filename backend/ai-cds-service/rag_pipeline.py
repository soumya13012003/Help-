import os
import re
import uuid
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# Initialize ChromaDB client (persistent storage)
chroma_client = chromadb.PersistentClient(path="/data/chromadb")
collection = chroma_client.get_or_create_collection(name="clinical_guidelines")

# Load open-source, locally run embedding model to prevent sending PHI to external APIs
model = SentenceTransformer('pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb')

def strip_phi(text: str) -> str:
    """
    Rudimentary PHI stripping using regex. 
    In production, use enterprise NLP (e.g. Amazon Comprehend Medical, Azure Text Analytics for Health).
    """
    # Remove obvious MRNs, SSNs, phone numbers, and dates
    text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]', text)
    text = re.sub(r'\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b', '[PHONE]', text)
    text = re.sub(r'\b\d{1,2}/\d{1,2}/\d{2,4}\b', '[DATE]', text)
    text = re.sub(r'\bMRN[-:]?\s*\d+\b', '[MRN]', text, flags=re.IGNORECASE)
    return text

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Semantic chunking with sliding window overlap."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def ingest_document(document_id: str, raw_text: str, metadata: dict):
    """
    Sanitizes, chunks, embeds, and stores clinical documents into ChromaDB.
    """
    safe_text = strip_phi(raw_text)
    chunks = chunk_text(safe_text)
    
    # Generate embeddings locally
    embeddings = model.encode(chunks).tolist()
    
    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [metadata for _ in chunks] # Attach same metadata to all chunks
    
    from typing import cast
    from chromadb.api.types import Metadata
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=cast(list[Metadata], metadatas)
    )
    print(f"Successfully ingested document {document_id} into ChromaDB.")

def retrieve_context(query: str, n_results: int = 3) -> list[str]:
    """Retrieves most semantically relevant clinical guidelines for the query."""
    query_embedding = model.encode([query]).tolist()
    
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results
    )
    
    return results['documents'][0] if results['documents'] else []
