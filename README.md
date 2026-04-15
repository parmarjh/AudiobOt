# 🎙️ Audio PDF Chatbot & Knowledge Assistant

A powerful, full-stack AI application that allows you to interact with your documents (PDF, DOCX, TXT) and web content (URLs, Wikipedia) using voice and text. Built with a FastAPI backend and a modern React frontend.

## ✨ Features

- **Multi-Source Ingestion**: Process PDFs, Word documents, text files, web URLs, and Wikipedia pages.
- **Efficient Retrieval**: Uses FAISS (Facebook AI Similarity Search) for high-performance vector retrieval.
- **RAG-Powered QA**: Answers questions based on the content of your documents using state-of-the-art language models.
- **Voice Agent**: Interactive voice-based chat interface for a hands-free experience.
- **Fast & Responsive**: Real-time processing and streaming capabilities.

## 🚀 Getting Started

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/parmarjh/Audio-chatbot-pdf.git
   cd Audio-chatbot-pdf
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server**:
   ```bash
   python server.py
   ```
   The backend will be available at `http://localhost:8000`.

### Frontend Setup

1. **Navigate to the UI directory**:
   ```bash
   cd ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## 🛠️ Built With

- **Backend**: FastAPI, FAISS, LangChain, PyPDF2, python-docx, Beautiful Soup.
- **Frontend**: React, Vite, Framer Motion, Vanilla CSS.

## 🤝 Contributions

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔗 Project Links

- **Main Repository**: [https://github.com/parmarjh/Audio-chatbot-pdf](https://github.com/parmarjh/Audio-chatbot-pdf)
- **Author GitHub**: [parmarjh](https://github.com/parmarjh)

---
Made with ❤️ by [parmarjh](https://github.com/parmarjh)
