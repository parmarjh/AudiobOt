from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil

from document_processor import (
    extract_text_from_pdf, 
    extract_text_from_docx, 
    extract_text_from_txt,
    extract_text_from_url,
    extract_text_from_wikipedia,
    chunk_text
)
from embeddings_index import build_faiss_index, search_similar_chunks
from answer_generator import generate_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class UrlRequest(BaseModel):
    url: str
    type: str = "web" # "web" or "wiki"

# Global knowledge base
chunks, index = None, None

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global chunks, index
    
    filename = file.filename.lower()
    temp_path = f"temp_{file.filename}"
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        if filename.endswith(".pdf"):
            raw_text = extract_text_from_pdf(temp_path)
        elif filename.endswith(".docx"):
            raw_text = extract_text_from_docx(temp_path)
        elif filename.endswith(".txt"):
            raw_text = extract_text_from_txt(temp_path)
        else:
            os.remove(temp_path)
            raise HTTPException(status_code=400, detail="Unsupported file format.")
            
        chunks = chunk_text(raw_text, chunk_size=300, overlap=50)
        index, _ = build_faiss_index(chunks)
        
        os.remove(temp_path)
        return {"status": "success", "message": f"Indexed {len(chunks)} chunks from {file.filename}"}
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/url")
async def ingest_url(req: UrlRequest):
    global chunks, index
    try:
        if req.type == "wiki":
            raw_text = extract_text_from_wikipedia(req.url)
        else:
            raw_text = extract_text_from_url(req.url)
            
        if not raw_text or len(raw_text) < 50:
             raise HTTPException(status_code=400, detail="Could not extract meaningful text from this source.")
             
        chunks = chunk_text(raw_text, chunk_size=300, overlap=50)
        index, _ = build_faiss_index(chunks)
        
        return {"status": "success", "message": f"Indexed {len(chunks)} chunks from {req.url}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    global chunks, index
    
    if not chunks:
        return {"reply": "Please provide a document or link first so I can answer your questions!"}

    # Retrieve relevant chunks
    relevant_chunks = search_similar_chunks(req.message, index, chunks, top_k=3)
    
    # Generate answer
    answer = generate_answer(req.message, relevant_chunks)
    
    return {"reply": answer}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

