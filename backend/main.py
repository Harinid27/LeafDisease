import os
import io
import numpy as np
from PIL import Image
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# 38 Classes list in alphabetical order (matching standard folder loading)
CLASS_NAMES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

model = None
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Model", "Leaf_disease_Prediction.h5"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    print(f"Loading Keras model from {MODEL_PATH}...")
    try:
        # Load the pre-trained Keras model (.h5)
        # We disable compiling metrics to speed up load time and avoid warnings
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        raise e
    yield
    print("Shutting down backend server...")

# Initialize FastAPI app
app = FastAPI(
    title="Leaf Disease Prediction API",
    description="Backend API that uses a Keras/TensorFlow model to predict leaf diseases.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (standard Vite dev server runs on http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "message": "Leaf Disease Prediction API is running!"
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    global model
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded on server.")
    
    # Read file content
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file. Please upload an image.")
            
    # Process image
    try:
        # Ensure it is in RGB format
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        # Resize to 256x256 as required by the model
        image = image.resize((256, 256))
        
        # Convert to numpy array
        img_array = np.array(image, dtype=np.float32)
        
        # Add batch dimension (1, 256, 256, 3)
        img_array = np.expand_dims(img_array, axis=0)
        
        # Preprocess using VGG16 standard ImageNet requirements (BGR conversion and mean subtraction)
        img_array = tf.keras.applications.vgg16.preprocess_input(img_array)
        
        # Run prediction
        predictions = model.predict(img_array)
        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_index])
        
        # Retrieve full label
        full_label = CLASS_NAMES[predicted_index]
        
        # Parse standard PlantVillage labels (e.g., Tomato___Early_blight or Apple___healthy)
        if "___" in full_label:
            parts = full_label.split("___")
            plant_name = parts[0].replace("_", " ").strip()
            disease_name = parts[1].replace("_", " ").strip()
        else:
            plant_name = "Unknown Plant"
            disease_name = full_label.replace("_", " ").strip()
            
        is_healthy = "healthy" in disease_name.lower()
        
        print(f"Prediction Success: file={file.filename}, index={predicted_index}, label={full_label}, confidence={confidence:.4f}")
        
        return {
            "success": True,
            "class_name": full_label,
            "plant": plant_name,
            "disease": disease_name,
            "is_healthy": is_healthy,
            "confidence": confidence,
            "confidence_percentage": round(confidence * 100, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

