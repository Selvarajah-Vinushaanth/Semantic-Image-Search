from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import numpy as np
import faiss
from transformers import CLIPProcessor, CLIPModel  # Reverted import
from supabase import create_client, Client
from fastapi import UploadFile, File, Request
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase setup
SUPABASE_URL = "https://fxr########################################"
SUPABASE_KEY = "eyJhbGciOiJ##############################################################I6MjA2NjkyODYwOH0.Oid2LwiQs497QCBrecoMVVxya_3kGoynhQ9YX5dA29M"
SUPABASE_BUCKET = "images"
SUPABASE_TABLE = "images"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize CLIP model and processor
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")  # Reverted initialization

# Helper to fetch all embeddings from Supabase
def fetch_all_embeddings():
    data = supabase.table(SUPABASE_TABLE).select("*").execute().data
    # Get list of files that actually exist in storage
    files = supabase.storage.from_(SUPABASE_BUCKET).list()
    existing_filenames = set(f['name'] for f in files)
    embeddings = []
    meta = []
    for row in data:
        if row["filename"] not in existing_filenames:
            continue
        emb = np.array(row["embedding"], dtype="float32")
        embeddings.append(emb)
        meta.append({
            "id": row["id"],
            "filename": row["filename"],
            "url": row["url"]
        })
    return np.array(embeddings), meta

# On startup, load all embeddings into FAISS
dimension = 512
index = faiss.IndexFlatIP(dimension)
meta_store = []

def reload_faiss_index():
    global index, meta_store
    embeddings, meta = fetch_all_embeddings()
    index = faiss.IndexFlatIP(dimension)
    if len(embeddings) > 0:
        faiss.normalize_L2(embeddings)
        index.add(embeddings)
    meta_store = meta

reload_faiss_index()

def normalize(vec):
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec
    return vec / norm

@app.get("/search/")
async def search_images(query: str, top_k: int = 5):
    # Use processor instead of feature extractor
    inputs = processor(text=[query], return_tensors="pt", padding=True)
    outputs = model.get_text_features(**inputs)
    query_embedding = outputs.detach().cpu().numpy()[0]
    query_embedding = normalize(query_embedding).astype('float32')
    query_embedding = np.expand_dims(query_embedding, axis=0)

    # Ensure index/meta_store are up-to-date and only reference existing files
    reload_faiss_index()
    if index.ntotal == 0:
        return {"results": []}

    D, I = index.search(query_embedding, top_k)
    results = []
    for idx in I[0]:
        if idx == -1 or idx >= len(meta_store):
            continue
        img = meta_store[idx]
        results.append({
            "id": img["id"],
            "filename": img["filename"],
            "image_base64": img["url"]  # frontend expects this key
        })

    return {"results": results}

@app.get("/images/")
async def list_images(query: str = None, top_k: int = 10):
    """
    If query is provided, return only the top_k most similar images using semantic search.
    If no query, return all images as before.
    """
    data = supabase.table(SUPABASE_TABLE).select("id,filename,url,embedding").execute().data
    files = supabase.storage.from_(SUPABASE_BUCKET).list()
    storage_filenames = set(f['name'] for f in files)
    # Filter only images that exist in storage
    filtered = [img for img in data if img["filename"] in storage_filenames]

    if query:
        # Compute query embedding
        inputs = processor(text=[query], return_tensors="pt", padding=True)
        outputs = model.get_text_features(**inputs)
        query_embedding = outputs.detach().cpu().numpy()[0]
        query_embedding = query_embedding / np.linalg.norm(query_embedding)
        # Prepare embeddings matrix
        img_embeddings = np.array([np.array(img["embedding"], dtype="float32") for img in filtered])
        if len(img_embeddings) == 0:
            return {"results": []}
        img_embeddings = img_embeddings / np.linalg.norm(img_embeddings, axis=1, keepdims=True)
        # Compute cosine similarity
        sims = np.dot(img_embeddings, query_embedding)
        # Get top_k indices
        top_indices = np.argsort(sims)[::-1][:top_k]
        results = []
        for idx in top_indices:
            if sims[idx] > 0:  # Only show positive similarity
                img = filtered[idx]
                results.append({
                    "id": img["id"],
                    "filename": img["filename"],
                    "image_base64": img["url"]
                })
        return {"results": results}
    else:
        # Default: show all images
        seen_filenames = set()
        results = []
        for img in filtered:
            if img["filename"] not in seen_filenames:
                results.append({
                    "id": img["id"],
                    "filename": img["filename"],
                    "image_base64": img["url"]
                })
                seen_filenames.add(img["filename"])
        return {"results": results}

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    # Get image embedding, move to CPU, convert to numpy, normalize
    inputs = processor(images=image, return_tensors="pt")
    outputs = model.get_image_features(**inputs)
    embedding = outputs.detach().cpu().numpy()[0]
    embedding = normalize(embedding).astype('float32')

    # Upload image to Supabase Storage only if it does not already exist
    supa_path = f"{file.filename}"
    storage_bucket = supabase.storage.from_(SUPABASE_BUCKET)
    files = storage_bucket.list()
    existing_filenames = set(f['name'] for f in files)
    if file.filename not in existing_filenames:
        storage_bucket.upload(supa_path, contents, {"content-type": file.content_type})
    public_url = storage_bucket.get_public_url(supa_path)

    # Insert metadata and embedding into Supabase table only if not already present
    existing = supabase.table(SUPABASE_TABLE).select("id").eq("filename", file.filename).execute().data
    if not existing:
        row = {
            "filename": file.filename,
            "url": public_url,
            "embedding": embedding.tolist()
        }
        res = supabase.table(SUPABASE_TABLE).insert(row).execute()
        reload_faiss_index()
        return {"message": "Upload successful", "id": res.data[0]["id"]}
    else:
        return {"message": "File already exists", "id": existing[0]["id"]}

@app.post("/delete_image/")
async def delete_image(request: Request):
    data = await request.json()
    img_id = data.get("id")
    filename = data.get("filename")
    if not img_id or not filename:
        return JSONResponse({"message": "Missing id or filename"}, status_code=400)
    # Delete from storage
    storage_bucket = supabase.storage.from_(SUPABASE_BUCKET)
    storage_bucket.remove([filename])
    # Delete from table
    supabase.table(SUPABASE_TABLE).delete().eq("id", img_id).execute()
    reload_faiss_index()
    return {"message": "Image deleted"}
    return {"message": "Image deleted"}
