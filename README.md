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

Create and activate a virtual environment:

```bash
conda create -n semantic-search python=3.11
conda activate semantic-search
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn backend:app --reload
```

> Your backend should now be running at: [http://localhost:8000](http://localhost:8000)

---

### 🖥️ Frontend Setup

Create the React app:

```bash
npx create-react-app semantic-search-frontend
```

Replace the contents of `src/` with your custom components (`App.jsx`, `index.css`, etc.).

Install dependencies and run:

```bash
npm install
npm start
```

> React app will now run at: [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
semantic-search/
├── backend.py                  # FastAPI backend with CLIP & FAISS
├── requirements.txt            # Python dependencies
├── uploads/                    # Image uploads (if using local storage)
└── semantic-search-frontend/   # React frontend
    ├── public/
    └── src/
        ├── App.jsx
        ├── index.css
        └── ...
```

---

## 📸 Example Usage

- Upload an image of a **cat**
- Type `cat` in the search bar
- Image of the cat will appear — matched using CLIP!

---

## 🔐 Optional: Supabase Setup

- Enable **public access** to the Storage bucket
- OR configure **Row Level Security (RLS)** to allow `anon` users `INSERT` and `SELECT`
- Update your backend to use Supabase Storage API if needed

---

