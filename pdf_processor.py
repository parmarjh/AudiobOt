import PyPDF2

def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF file"""
    text = ""
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text

def chunk_text(text, chunk_size=300, overlap=50):
    """
    Split text into overlapping chunks.
    overlap ensures context isn't lost at chunk boundaries.
    """
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk:
            chunks.append(chunk)
    
    return chunks

# Usage
# text = extract_text_from_pdf("document.pdf")
# chunks = chunk_text(text)
# print(f"Total chunks: {len(chunks)}")