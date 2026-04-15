import PyPDF2
from docx import Document
import requests
from bs4 import BeautifulSoup
import wikipediaapi
import os

def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF file"""
    text = ""
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
    return text

def extract_text_from_docx(docx_path):
    """Extract text from a .docx file"""
    doc = Document(docx_path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_text_from_txt(txt_path):
    """Extract text from a .txt file"""
    with open(txt_path, "r", encoding="utf-8") as f:
        return f.read()

def extract_text_from_url(url):
    """Extract text from a webpage URL"""
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Remove script and style elements
    for script_or_style in soup(["script", "style"]):
        script_or_style.decompose()
        
    # Get text
    text = soup.get_text()
    
    # Break into lines and remove leading/trailing whitespace
    lines = (line.strip() for line in text.splitlines())
    # Break multi-headlines into a line each
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    # Drop blank lines
    text = '\n'.join(chunk for chunk in chunks if chunk)
    
    return text

def extract_text_from_wikipedia(topic):
    """Extract text from a Wikipedia page"""
    wiki_wiki = wikipediaapi.Wikipedia(
        user_agent='AudioChatbot/1.0 (https://example.com/audiochatbot; mail@example.com)',
        language='en',
        extract_format=wikipediaapi.ExtractFormat.WIKI
    )
    page_py = wiki_wiki.page(topic)
    if not page_py.exists():
        return f"Wikipedia page for '{topic}' does not exist."
    return page_py.summary + "\n\n" + page_py.text

def chunk_text(text, chunk_size=300, overlap=50):
    """
    Split text into overlapping chunks for RAG.
    """
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk:
            chunks.append(chunk)
    
    return chunks
