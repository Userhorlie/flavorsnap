from flask import Flask, request, jsonify
from PIL import Image
import io
import time
from logger_config import logger

app = Flask(__name__)

@app.before_request
def log_request_info():
    """Log incoming request details"""
    logger.log_api_request(
        method=request.method,
        endpoint=request.endpoint or request.path,
        headers=dict(request.headers),
        body=request.get_json(silent=True) or {}
    )

@app.after_request  
def log_response_info(response):
    """Log outgoing response details"""
    logger.log_api_response(
        method=request.method,
        endpoint=request.endpoint or request.path,
        status_code=response.status_code,
        response_body=response.get_json(silent=True) or {},
        duration_ms=None  # Could be calculated with request start time
    )
    return response

@app.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()
    
    if 'image' not in request.files:
        logger.warning("No image uploaded in request", request_files=list(request.files.keys()))
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    logger.info("Processing image prediction", filename=file.filename, content_type=file.content_type)
    
    try:
        # Placeholder for preprocessing & prediction
        image = Image.open(file.stream)
        logger.debug("Image loaded successfully", image_size=image.size, image_mode=image.mode)
        
        # TODO: Resize, normalize, and run model here
        predicted_label = "Moi Moi"  # Dummy output for now
        
        duration_ms = (time.time() - start_time) * 1000
        logger.info(
            "Prediction completed successfully",
            predicted_label=predicted_label,
            processing_time_ms=duration_ms
        )
        
        return jsonify({'label': predicted_label})
        
    except Exception as e:
        logger.log_error_with_traceback("Failed to process image prediction", e)
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    logger.info("Health check requested")
    return jsonify({
        'status': 'healthy',
        'service': 'flavorsnap-ml-api',
        'timestamp': time.time()
    })

if __name__ == '__main__':
    logger.info("Starting FlavorSnap ML API server", debug=True)
    app.run(debug=True)
