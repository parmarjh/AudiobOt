import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# Load embedding model (converts text → vectors)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def build_faiss_index(chunks):
    """
    Convert chunks to embeddings and store in FAISS index.
    FAISS = Facebook AI Similarity Search (fast nearest-neighbor search)
    """
    print("Building embeddings...")
    embeddings = embedder.encode(chunks, show_progress_bar=True)
    
    # embeddings shape: (num_chunks, 384)
    dimension = embeddings.shape[1]
    
    # Create flat L2 (Euclidean distance) index
    index = faiss.IndexFlatL2(dimension)
    
    # Add all embeddings to index
    index.add(np.array(embeddings, dtype=np.float32))
    
    print(f"Index built with {index.ntotal} vectors")
    return index, embeddings

def search_similar_chunks(query, index, chunks, top_k=5):
    """
    Find top_k most relevant chunks for the query.
    Returns chunks that are semantically closest to the query.
    """
    # Convert query to same embedding space
    query_embedding = embedder.encode([query])
    
    # Search FAISS index — returns distances + indices
    distances, indices = index.search(
        np.array(query_embedding, dtype=np.float32), top_k
    )
    
    # Retrieve actual text chunks
    results = [chunks[i] for i in indices[0] if i < len(chunks)]
    return results