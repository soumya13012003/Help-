import os
import sys

# Add mlops to path if needed or run from backend/ai-cds-service
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mlops.rag_pipeline import HybridRagPipeline

def run_test():
    print("Initializing HybridRagPipeline...")
    # Use a local directory for testing instead of /data/chromadb
    pipeline = HybridRagPipeline(db_path="./test_chromadb")
    
    print("Adding sample clinical guidelines...")
    docs = [
        "Aspirin is recommended for patients with a high risk of cardiovascular disease.",
        "Ibuprofen is commonly used to treat pain and inflammation.",
        "Beta-blockers are prescribed for hypertension and cardiology issues."
    ]
    
    # Generate embeddings using our BioBERT model
    embeddings = pipeline.model.encode(docs).tolist()

    pipeline.collection.add(
        documents=docs,
        embeddings=embeddings,
        metadatas=[
            {"condition": "Cardiology", "uri": "doc1"},
            {"condition": "General", "uri": "doc2"},
            {"condition": "Cardiology", "uri": "doc3"}
        ],
        ids=["id1", "id2", "id3"]
    )
    
    query = "What medication is for hypertension?"
    print(f"\nRunning hybrid search for query: '{query}' with condition_filter='Cardiology'")
    
    response = pipeline.hybrid_search(
        clinical_query=query,
        condition_filter="Cardiology",
        n_results=2
    )
    
    print("\n--- Search Results ---")
    for doc, meta in zip(response.documents, response.metadata):
        print(f"Document: {doc}")
        print(f"Metadata: {meta}\n")

if __name__ == "__main__":
    run_test()
