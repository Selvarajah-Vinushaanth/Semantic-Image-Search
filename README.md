# 🧠 Semantic Image Search

This is a full-stack application that allows users to **upload images** and **search them by typing a text description** (e.g., "cat", "car", "sunset"). It uses OpenAI’s CLIP model to match image content with natural language.

---

## ✨ Features

- 🔍 Search images by describing them (no manual tags required)
- 🖼️ Upload and store image files (via Supabase or locally)
- 💡 CLIP model generates embeddings for both image and text
- ⚡ Fast similarity search using FAISS
- 🌐 Full frontend built with React + vanilla CSS

---

## 🧰 Tech Stack

| Layer       | Tech Used                        |
|-------------|----------------------------------|
| Frontend    | React, JavaScript, CSS           |
| Backend     | FastAPI, Uvicorn, Python         |
| ML Model    | OpenAI CLIP via HuggingFace      |
| Search      | FAISS (vector similarity search) |
| Storage     | Supabase Storage *(optional)* or local file system |

---

## 🚀 Getting Started

### 🔧 Backend Setup

**Create a virtual environment** (optional but recommended):

    ```bash
    conda create -n semantic-search python=3.11
    conda activate semantic-search
    
    Install dependencies:
    pip install -r requirements.txt
    
    Run the backend:
    uvicorn backend:app --reload

    Make sure your backend runs on http://localhost:8000.

**Frontend Setup**
  Create the React app (if not cloned already):
  
  
  npx create-react-app semantic-search-frontend
  Replace src/ with your custom components (App.jsx, index.css, etc.)
  
  Run the frontend:
  npm install
  npm start
  
  React app will run on http://localhost:3000.

  semantic-search/
├── backend.py              # FastAPI backend with CLIP & FAISS
├── requirements.txt
├── uploads/                # Image uploads (if using local storage)
└── semantic-search-frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   └── ...
    └── public/
