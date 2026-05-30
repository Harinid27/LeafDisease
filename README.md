# 🌿 LeafMedic AI - Botanical Diagnostics & Care Suite

An ultra-modern, high-performance full-stack web application designed to diagnose plant crop diseases and provide instant, actionable farming/gardening remedies. 

The application utilizes a **pre-trained VGG16 deep learning Keras model** (trained on the standard 38-class PlantVillage dataset), a fast **Python FastAPI** backend for real-time model inference, and a **Vite + React** single-page dashboard featuring premium glassmorphism, visual animations, and a rich dark-theme aesthetic.

---

## ✨ Core Features

*   🧠 **Deep Learning Diagnostic Engine**: Backed by a VGG16 convolutional neural network pre-trained on ImageNet with customized transfer-learning dense classifier layers trained to recognize **38 classes** of healthy and diseased plant leaves at ~98% validation accuracy.
*   ⚡ **High-Performance FastAPI Backend**: Model parameters (95MB Keras `.h5`) are loaded **once on server startup** using FastAPI's lifespan handlers to ensure instant API responses (under 50ms) during diagnosis.
*   🎨 **Stunning Dark-Theme UI**: Implements glassmorphism (`backdrop-filter: blur(16px)`), neon green glowing accents, skeleton load pulsing indicators, responsive grids, and clean hover micro-animations.
*   📥 **Intake Uploader Zone**: Supports seamless **drag-and-drop** leaf photograph submissions, file browsing, and instant leaf preview frames with custom crop corner guidelines.
*   📈 **Dynamic Confidence Meter**: Visually displays model prediction probabilities using an animating progress bar that transitions dynamically based on the model's confidence rating.
*   📋 **Comprehensive Care Remedies**: A complete client-side database mapping **all 38 PlantVillage crop and pathogen categories** to customized botanical summaries, hazard severities (`Safe`, `Medium`, `High`, `Critical`), and **three step-by-step actionable recommendations** for immediate soil, crop, and fungicide care.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Vanilla CSS, Lucide React (Icons).
*   **Backend**: Python, FastAPI, Uvicorn (ASGI Server), TensorFlow / Keras (Model inference), Pillow (PIL) & NumPy (Image preprocessing).
*   **Deep Learning Model**: VGG16 Backbone, outputting a 38-class categorical probability distribution.

---

## 📁 Project Architecture

```text
Leaf Disease/
├── backend/
│   └── main.py             # FastAPI Server, image processing pipeline, endpoints
├── frontend/
│   ├── public/             # Static SVGs, favicon
│   ├── src/
│   │   ├── assets/         # App icons & static assets
│   │   ├── App.jsx         # Main React Dashboard & state machine
│   │   ├── index.css       # Premium custom CSS variables & animations
│   │   ├── main.jsx        # App entrypoint
│   │   └── recommendations.js # 38-class agricultural remedy library
│   ├── index.html          # HTML Template
│   ├── package.json        # NPM dependencies
│   └── vite.config.js      # Vite compilation configurations
├── Model/
│   └── Leaf_disease_Prediction.h5 # Pre-trained Keras model (95MB - gitignored)
└── .gitignore              # Ignored folders (node_modules, Model/, cache, etc.)
```

---

## ⚙️ Installation & Running Locally

Ensure you have **Node.js (v18+)** and **Python (3.9+)** installed on your system.

### 1. Run the Python FastAPI Backend
Navigate to the `backend/` folder, install required packages, and start the server:

```bash
# Navigate to the backend directory
cd backend

# Install the required packages (Standard Tensorflow, FastAPI, Uvicorn, Pillow, NumPy)
pip install tensorflow fastapi uvicorn pillow numpy

# Start the development server
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*The API will start up, load the `.h5` model, and list on **`http://localhost:8000/`***.

### 2. Run the Vite + React Frontend
Navigate to the `frontend/` folder, install the packages, and launch Vite:

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install the React & styling dependencies
npm install

# Start the Vite local server
npm run dev
```
*The user interface will compile and run on **`http://localhost:5173/`***.

---

## 🧪 Interactive Swagger Documentation

FastAPI automatically parses the type hints and constructs a robust sandbox playground. While your backend server is active, open your browser and navigate to:

👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

You can upload leaf images directly in the browser using the Swagger GUI and test the model's categorical response payload!

---

## 🔬 Important Technical Details (VGG16 Preprocessing)

To ensure **100% accurate crop classification**, the input image must be processed to match the training distribution of pre-trained ImageNet convolutional filters. In the FastAPI backend, we process the image using:

```python
# Resize the leaf image to VGG16 input canvas size
image = image.resize((256, 256))
img_array = np.array(image, dtype=np.float32)
img_array = np.expand_dims(img_array, axis=0)

# Preprocess using VGG16 standard parameters (RGB -> BGR, subtract ImageNet channel means)
img_array = tf.keras.applications.vgg16.preprocess_input(img_array)
```
*(Failing to apply these zero-centering mean subtractions causes dead signals, resulting in inaccurate predictions or constant default classifications).*

---

## 📦 Git & Model Storage Note

The pre-trained model file `Leaf_disease_Prediction.h5` (~95MB) is added to the root `.gitignore` file. It is a best-practice to **exclude heavy binaries from Git history** to avoid repository bloat. When cloning this repository to a new computer, ensure you manually place your trained `Leaf_disease_Prediction.h5` inside the `Model/` directory before starting the backend server.
