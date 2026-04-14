FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for OpenCV and FaceNet
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download FaceNet weights by running a dummy python script
RUN python -c "from deepface import DeepFace; import numpy as np; dummy = np.zeros((224, 224, 3), dtype=np.uint8); DeepFace.represent(dummy, model_name='Facenet', enforce_detection=False)" || true

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
