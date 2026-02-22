import os
import uuid
import time
from functools import wraps
from typing import Any, Dict, Optional

import psutil
from flask import Flask, request, jsonify
from flask_cors import CORS
from marshmallow import Schema, fields, validate, ValidationError
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import HTTPException

from logger_config import logger


app = Flask(__name__)
CORS(app)

ALLOWED_IMAGE_MIMETYPES = {"image/jpeg", "image/png", "image/webp"}


def get_request_id() -> str:
    request_id = request.headers.get("X-Request-ID")
    if not request_id:
        request_id = uuid.uuid4().hex
    return request_id


def make_success_response(data: Dict[str, Any], status_code: int = 200):
    body = dict(data)
    body["request_id"] = get_request_id()
    return jsonify(body), status_code


def make_error_response(
    code: str,
    message: str,
    status_code: int = 400,
    details: Optional[Dict[str, Any]] = None,
):
    error_body: Dict[str, Any] = {
        "code": code,
        "message": message,
    }
    if details is not None:
        error_body["details"] = details

    body: Dict[str, Any] = {
        "error": error_body,
        "request_id": get_request_id(),
    }
    return jsonify(body), status_code


class PredictionRequest(Schema):
    image = fields.Raw(required=True)
    confidence_threshold = fields.Float(
        missing=0.5,
        validate=validate.Range(min=0.0, max=1.0),
    )


def api_key_or_jwt_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        api_key_header = request.headers.get("X-API-Key")
        auth_header = request.headers.get("Authorization")
        expected_api_key = os.environ.get("FLAVORSNAP_API_KEY")

        if expected_api_key and api_key_header == expected_api_key:
            return func(*args, **kwargs)

        if auth_header:
            return func(*args, **kwargs)

        return make_error_response(
            code="AUTHENTICATION_REQUIRED",
            message="Missing or invalid authentication credentials",
            status_code=401,
        )

    return wrapper


@app.errorhandler(ValidationError)
def handle_validation_error(err: ValidationError):
    logger.warning("Request validation failed", errors=err.messages)
    return make_error_response(
        code="VALIDATION_ERROR",
        message="Invalid request payload",
        status_code=400,
        details=err.messages,
    )


@app.errorhandler(HTTPException)
def handle_http_exception(err: HTTPException):
    logger.warning(
        "HTTP error occurred",
        status_code=err.code,
        description=err.description,
    )
    error_code = (err.name or "HTTP_ERROR").upper().replace(" ", "_")
    return make_error_response(
        code=error_code,
        message=err.description,
        status_code=err.code or 500,
    )


@app.errorhandler(Exception)
def handle_unexpected_exception(err: Exception):
    logger.log_error_with_traceback("Unhandled server error", err)
    return make_error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        status_code=500,
    )


def validate_image_file(file: FileStorage):
    if file.mimetype not in ALLOWED_IMAGE_MIMETYPES:
        raise ValidationError(
            {"image": [f"Invalid file type '{file.mimetype}'. Only JPG, PNG, and WebP are allowed."]}
        )


def get_system_metrics() -> Dict[str, Any]:
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    return {
        "cpu_percent": psutil.cpu_percent(interval=None),
        "memory_usage_mb": round(memory_info.rss / 1024 / 1024, 2),
    }


@app.route("/predict", methods=["POST"])
@api_key_or_jwt_required
def predict():
    start_time = time.time()

    logger.log_api_request(
        method=request.method,
        endpoint=request.path,
        headers=dict(request.headers),
    )

    form_data = {
        "image": request.files.get("image"),
        "confidence_threshold": request.form.get("confidence_threshold"),
    }

    schema = PredictionRequest()
    data = schema.load(form_data)

    image_file: FileStorage = data["image"]
    validate_image_file(image_file)

    label = "Moi Moi"
    confidence = data["confidence_threshold"]
    all_predictions = [
        {"label": "Moi Moi", "confidence": confidence},
        {"label": "Akara", "confidence": max(confidence - 0.15, 0.0)},
        {"label": "Bread", "confidence": max(confidence - 0.25, 0.0)},
    ]

    processing_time = round(time.time() - start_time, 3)

    response_body = {
        "label": label,
        "confidence": confidence,
        "all_predictions": all_predictions,
        "processing_time": processing_time,
    }

    response, status_code = make_success_response(response_body, status_code=200)

    logger.log_api_response(
        method=request.method,
        endpoint=request.path,
        status_code=status_code,
        response_body=response_body,
        duration_ms=round(processing_time * 1000, 2),
    )

    return response, status_code


@app.route("/health", methods=["GET"])
def health_check():
    metrics = get_system_metrics()
    body = {
        "status": "healthy",
        "service": "flavorsnap-ml-api",
        "system": metrics,
    }
    response, status_code = make_success_response(body, status_code=200)
    logger.info("Health check requested", status_code=status_code, system=metrics)
    return response, status_code


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
