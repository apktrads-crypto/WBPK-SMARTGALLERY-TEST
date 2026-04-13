from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace
import os
import shutil
import tempfile

app = FastAPI(title="WeddingsByPK Face Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageRequest(BaseModel):
    imageUrl: str

@app.post("/extract-faces")
async def extract_faces(req: ImageRequest):
    # Expects an absolute path on the local file system (we share volume/filesystem)
    file_path = req.imageUrl
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image file not found")
        
    try:
        # Generate embeddings using Facenet
        objs = DeepFace.represent(img_path = file_path, model_name = "Facenet", enforce_detection=False)
        # objs is a list of dicts, each containing 'embedding', 'facial_area', etc
        return {"embeddings": [obj['embedding'] for obj in objs], "raw": objs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match-selfie")
async def match_selfie(file: UploadFile = File(...)):
    # Save the uploaded selfie temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
        shutil.copyfileobj(file.file, temp)
        temp_path = temp.name
        
    try:
        objs = DeepFace.represent(img_path = temp_path, model_name = "Facenet", enforce_detection=True)
        
        if len(objs) > 0:
            embedding = objs[0]["embedding"]
            return {"embedding": embedding}
        else:
            raise HTTPException(status_code=400, detail="No face detected in selfie")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
