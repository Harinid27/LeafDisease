import React, { useState } from 'react';
import { 
  Leaf, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { recommendations } from './recommendations';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle Drag Over
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle File Drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      } else {
        setError("Please upload an image file (PNG, JPG, JPEG).");
      }
    }
  };

  // Handle Input File Select
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Process Selected File
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError(null);
    setResult(null);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Reset Application State
  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  // Trigger Prediction
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Server error occurred during prediction.");
      }

      const data = await response.json();
      
      // Fetch recommendations mapped to predicted class name
      const classRec = recommendations[data.class_name] || {
        crop: data.plant || "Unknown",
        disease: data.disease || "Unknown Disease",
        severity: data.is_healthy ? "Safe" : "High",
        description: "No specific catalogued description found. Please maintain standard watering, soil, and sunlight conditions.",
        actions: [
          "Isolate the plant from healthy crops immediately.",
          "Check agricultural extension services for localized treatment guidelines.",
          "Ensure clean, sterilized pruning instruments are used."
        ]
      };

      setResult({
        ...data,
        crop: classRec.crop,
        disease: classRec.disease,
        severity: classRec.severity,
        description: classRec.description,
        actions: classRec.actions
      });

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect to the backend server. Make sure the FastAPI app is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container animate-fade-in">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <Leaf className="logo-icon animate-float" />
          <div>
            <h1 className="logo-text">LeafMedic AI</h1>
            <span className="logo-tagline">Botanical Diagnosis Suite</span>
          </div>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          Diagnostic API Online
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="dashboard-grid">
        {/* Left Side: Upload & Input Panel */}
        <section className="glass-panel preview-card animate-slide-up">
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            Leaf Specimen Intake
          </h2>

          {!imagePreview ? (
            // Upload Dropzone
            <div 
              className={`dropzone-container ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <UploadCloud className="dropzone-icon animate-float" />
              <div className="dropzone-text">
                <h3>Submit Leaf Specimen</h3>
                <p>Drag and drop your leaf photograph here, or browse your files</p>
                <input 
                  type="file" 
                  id="leaf-file-input" 
                  style={{ display: 'none' }} 
                  onChange={handleFileInput}
                  accept="image/*"
                />
                <button 
                  className="upload-button"
                  onClick={() => document.getElementById('leaf-file-input').click()}
                >
                  Browse Files
                </button>
              </div>
            </div>
          ) : (
            // Image Preview Frame
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="image-frame">
                <img 
                  src={imagePreview} 
                  alt="Leaf specimen preview" 
                  className="preview-image"
                />
                <div className="frame-decor decor-tl"></div>
                <div className="frame-decor decor-tr"></div>
                <div className="frame-decor decor-bl"></div>
                <div className="frame-decor decor-br"></div>
              </div>

              {/* Action Buttons */}
              <div className="action-row">
                <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                  <RefreshCw style={{ width: '16px', height: '16px' }} />
                  Clear File
                </button>
                <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
                  <Leaf style={{ width: '16px', height: '16px' }} />
                  {loading ? "Analyzing..." : "Run Diagnosis"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              alignItems: 'center', 
              padding: '1rem', 
              borderRadius: '12px', 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.9rem',
              lineHeight: '1.4'
            }}>
              <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Right Side: Diagnostics & Recommendations Panel */}
        <section className="glass-panel results-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {loading ? (
            // Immersive Loader
            <div className="loading-wrapper">
              <div className="spinner-ring">
                <div className="spinner-circle"></div>
                <Leaf className="spinner-icon" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Executing Diagnosis</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Extracting features & assessing leaf health via AI model...</p>
              </div>
            </div>
          ) : result ? (
            // Results & Recommendation Display
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Header Info */}
              <div className="result-header">
                <div>
                  <span className="crop-name">{result.crop} specimen</span>
                  <h2 className="disease-name">{result.disease}</h2>
                </div>
                <span className={`result-badge ${result.is_healthy ? 'badge-healthy' : 'badge-diseased'}`}>
                  {result.is_healthy ? "Healthy" : `Diseased (${result.severity})`}
                </span>
              </div>

              {/* Confidence progress */}
              <div className="confidence-box">
                <div className="confidence-header">
                  <span>Diagnostic Confidence</span>
                  <span className="confidence-val">
                    <TrendingUp style={{ width: '15px', height: '15px', display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    {result.confidence_percentage}%
                  </span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${result.confidence_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Disease Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldAlert style={{ width: '18px', height: '18px', color: result.is_healthy ? 'var(--primary)' : 'var(--warning)' }} />
                  Assessment & Pathogen Overview
                </h3>
                <p className="description-text">{result.description}</p>
              </div>

              {/* Actionable Remedies (JS Loaded) */}
              <div className="recommendations-section">
                <h3 className="reco-title">
                  <CheckCircle style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                  Actionable Recommendations
                </h3>
                <div className="reco-list">
                  {result.actions.map((action, index) => (
                    <div key={index} className="reco-item">
                      <span className="reco-num">{index + 1}</span>
                      <p className="reco-text">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Awaiting Diagnosis / Prompt State
            <div className="empty-state">
              <ShieldAlert className="empty-icon animate-float" />
              <h3>Awaiting Specimen Analysis</h3>
              <p>Upload a photograph of a plant leaf and click 'Run Diagnosis' to check health status and retrieve customized gardening remedies.</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Powered by Deep Neural Networks & Agri-Science • Created for <a href="#" className="footer-link">Leaf Disease Diagnosis Suite</a>
        </p>
      </footer>
    </div>
  );
}
