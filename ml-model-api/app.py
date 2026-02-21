import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Fix #41: Configure CORS
# Allow requests from frontend (default localhost:3000)
CORS(app, origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")])

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": True,
        "version": "1.0.0"
    })

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    # Placeholder for model inference
    return jsonify({
        "label": "Moi Moi",
        "confidence": 0.85,
        "all_predictions": [
            { "label": "Moi Moi", "confidence": 0.85 },
            { "label": "Akara", "confidence": 0.10 }
        ]
    })

@app.route('/classes', methods=['GET'])
def classes():
    classes_list = ["Akara", "Bread", "Egusi", "Moi Moi", "Rice and Stew", "Yam"]
    return jsonify({
        "classes": classes_list,
        "count": len(classes_list)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)