import chromadb
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel, Field
from typing import Any, List, Dict
import uuid

class RagQueryResponse(BaseModel):
    documents: list[str] = Field(..., description="The raw medical text chunks retrieved")
    metadata: list[dict] = Field(..., description="Citations and document URIs")

class HybridRagPipeline:
    def __init__(self, db_path: str = "/data/chromadb"):
        self.chroma_client = chromadb.PersistentClient(path=db_path)
        self.collection = self.chroma_client.get_or_create_collection(name="clinical_guidelines")
        # Local, lightweight medical embeddings (Zero PHI leakage)
        self.model = SentenceTransformer('pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb')

    def chunk_clinical_text(self, text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
        """
        Implements semantic chunking with sliding window overlap for clinical literature.
        Ensures context (like drug dosages) isn't lost at chunk boundaries.
        """
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
        return chunks

    def ingest_clinical_guidelines(self, document_id: str, raw_text: str, condition_tag: str):
        """
        Parses, chunks, embeds, and stores clinical guidelines in ChromaDB.
        """
        chunks = self.chunk_clinical_text(raw_text)
        
        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        # Embed metadata for hybrid filtering
        metadatas = [{"document_id": document_id, "condition": condition_tag} for _ in chunks]
        
        self.add_documents(documents=chunks, metadatas=metadatas, ids=ids)
        print(f"Ingested {len(chunks)} chunks for document {document_id}")

    def hybrid_search(self, clinical_query: str, condition_filter: str | None = None, n_results: int = 3) -> RagQueryResponse:
        """
        Executes a Hybrid Search: Semantic Vector Search + Keyword Metadata Filtering.
        This ensures we only pull guidelines relevant to the specific condition (e.g., Cardiology).
        """
        query_embedding = self.model.encode([clinical_query]).tolist()
        
        # Build ChromaDB 'where' filter for metadata keywords
        where_clause: dict[str, Any] | None = None
        if condition_filter:
            where_clause = {"condition": condition_filter}
            
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=n_results,
            where=where_clause
        )
        
        docs = results.get('documents')
        docs_list = docs[0] if docs and docs[0] is not None else []
        
        metas = results.get('metadatas')
        metas_list = metas[0] if metas and metas[0] is not None else []
        
        from typing import cast
        return RagQueryResponse(documents=docs_list, metadata=cast(list[dict[str, Any]], metas_list))

    def add_documents(self, documents: list[str], metadatas: list[dict[str, Any]], ids: list[str]):
        """
        Generates embeddings using the BioBERT model and adds the documents to ChromaDB.
        """
        embeddings = self.model.encode(documents).tolist()
        from typing import cast
        from chromadb.api.types import Metadata
        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=cast(list[Metadata], metadatas),
            ids=ids
        )

