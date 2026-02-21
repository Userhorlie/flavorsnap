import os
import uuid
import logging
import psutil
from functools import wraps
from flask import Flask, request, jsonify

@app.route('/predict', methods=['POST'])
@api_key_or_jwt_required
def predict():
    start_time = time.time()
    
    if 'image' not in request.files:


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
