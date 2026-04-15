from pdf_processor import extract_text_from_pdf, chunk_text
from embeddings_index import build_faiss_index, search_similar_chunks
from answer_generator import generate_answer
from voice_handler import record_audio, speech_to_text, text_to_speech

def initialize_pdf(pdf_path):
    """Step 1: Process PDF and build knowledge base"""
    print(f"\n📄 Loading PDF: {pdf_path}")
    
    # Extract text
    raw_text = extract_text_from_pdf(pdf_path)
    
    # Split into chunks
    chunks = chunk_text(raw_text, chunk_size=300, overlap=50)
    print(f"✅ Created {len(chunks)} chunks")
    
    # Build FAISS index
    index, embeddings = build_faiss_index(chunks)
    print("✅ FAISS index ready\n")
    
    return chunks, index

def ask_question(question, chunks, index, voice_output=False):
    """Step 2: Answer a question using RAG"""
    print(f"\n❓ Question: {question}")
    
    # Retrieve relevant chunks (Retrieval)
    relevant_chunks = search_similar_chunks(question, index, chunks, top_k=3)
    print(f"🔍 Found {len(relevant_chunks)} relevant chunks")
    
    # Generate answer (Augmented Generation)
    answer = generate_answer(question, relevant_chunks)
    print(f"💬 Answer: {answer}")
    
    # Optional: speak the answer
    if voice_output:
        text_to_speech(answer)
    
    return answer

def main():
    import os
    # Initialize with your PDF
    pdf_path = input("Enter the path to your PDF file: ").strip()
    while not os.path.exists(pdf_path) or not pdf_path.endswith('.pdf'):
        print("Invalid PDF path. Please enter a valid PDF path.")
        pdf_path = input("Enter the path to your PDF file: ").strip()
        
    chunks, index = initialize_pdf(pdf_path)
    
    print("\nChoose input mode:")
    print("1 → Text input")
    print("2 → Voice input")
    
    while True:
        mode = input("\nMode (1/2) or 'quit': ").strip()
        
        if mode == "quit":
            break
        elif mode == "1":
            question = input("Your question: ").strip()
        elif mode == "2":
            audio_path = record_audio(duration=5)
            question = speech_to_text(audio_path)
        else:
            continue
        
        if question:
            ask_question(question, chunks, index, voice_output=(mode == "2"))

if __name__ == "__main__":
    main()