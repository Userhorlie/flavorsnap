import os
import time
import uuid
import base64
import logging
import psutil
from functools import wraps
from datetime import datetime, timezone
from flask import Flask, request, jsonify

from logger_config import logger

app = Flask(__name__)

# In-memory store for predictions (replace with DB in production)
# Each item: { id, label, confidence, created_at, all_predictions?, processing_time? }
_predictions_store = []

# Pagination defaults
DEFAULT_PAGE = 1
DEFAULT_LIMIT = 20
MAX_LIMIT = 100
ALLOWED_SORT_FIELDS = {'created_at', 'label', 'confidence', 'id'}
ALLOWED_ORDERS = {'asc', 'desc'}


def api_key_or_jwt_required(f):
    """Placeholder auth decorator; add API key or JWT validation as needed."""
    @wraps(f)
    def decorated(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated


def _encode_cursor(value: str) -> str:
    """Encode cursor for next/prev page."""
    return base64.urlsafe_b64encode(value.encode()).decode() if value else None


def _decode_cursor(cursor: str):
    """Decode cursor; returns None if invalid."""
    if not cursor:
        return None
    try:
        return base64.urlsafe_b64decode(cursor.encode()).decode()
    except Exception:
        return None


def _apply_filters(items, label=None, confidence_min=None, confidence_max=None,
                   created_after=None, created_before=None):
    """Apply query filters to a list of prediction dicts."""
    for item in items:
        if label is not None:
            if isinstance(label, str) and item.get('label') != label:
                continue
            if isinstance(label, (list, tuple)) and item.get('label') not in label:
                continue
        if confidence_min is not None and (item.get('confidence') or 0) < confidence_min:
            continue
        if confidence_max is not None and (item.get('confidence') or 0) > confidence_max:
            continue
        created = item.get('created_at')
        if created_after is not None and created and created < created_after:
            continue
        if created_before is not None and created and created > created_before:
            continue
        yield item


def _parse_filters():
    """Parse filter query params from request."""
    label = request.args.get('label', type=str)
    if label and ',' in label:
        label = [s.strip() for s in label.split(',') if s.strip()]
    confidence_min = request.args.get('confidence_min', type=float)
    confidence_max = request.args.get('confidence_max', type=float)
    created_after = request.args.get('created_after', type=str)  # ISO datetime
    created_before = request.args.get('created_before', type=str)
    if created_after:
        try:
            created_after = datetime.fromisoformat(created_after.replace('Z', '+00:00'))
        except ValueError:
            created_after = None
    if created_before:
        try:
            created_before = datetime.fromisoformat(created_before.replace('Z', '+00:00'))
        except ValueError:
            created_before = None
    return {
        'label': label if label else None,
        'confidence_min': confidence_min,
        'confidence_max': confidence_max,
        'created_after': created_after,
        'created_before': created_before,
    }


def _parse_sort():
    """Parse sort query params; return (sort_by, order)."""
    sort_by = request.args.get('sort_by', 'created_at', type=str).lower()
    order = request.args.get('order', 'desc', type=str).lower()
    if sort_by not in ALLOWED_SORT_FIELDS:
        sort_by = 'created_at'
    if order not in ALLOWED_ORDERS:
        order = 'desc'
    return sort_by, order


@app.route('/predict', methods=['POST'])
@api_key_or_jwt_required
def predict():
    start_time = time.time()
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    # Minimal implementation: store a placeholder prediction so GET /predictions has data
    pred_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    placeholder = {
        'id': pred_id,
        'label': 'Moi Moi',
        'confidence': 85.0,
        'created_at': now,
        'processing_time': round(time.time() - start_time, 4),
    }
    _predictions_store.append(placeholder)
    return jsonify({
        'id': pred_id,
        'label': placeholder['label'],
        'confidence': placeholder['confidence'],
        'created_at': now,
        'processing_time': placeholder['processing_time'],
    }), 200


@app.route('/predictions', methods=['GET'])
def get_predictions():
    """
    List predictions with pagination (page/limit and cursor), filtering, and sorting.

    Query params:
      - page, limit: offset-based pagination (default page=1, limit=20, max limit=100)
      - cursor: cursor-based pagination (opaque token from previous response)
      - label: filter by label (exact or comma-separated list)
      - confidence_min, confidence_max: filter by confidence
      - created_after, created_before: ISO datetime filter
      - sort_by: created_at | label | confidence | id (default created_at)
      - order: asc | desc (default desc)
    """
    # Pagination: offset-based
    page = request.args.get('page', DEFAULT_PAGE, type=int)
    limit = request.args.get('limit', DEFAULT_LIMIT, type=int)
    if page < 1:
        page = 1
    if limit < 1 or limit > MAX_LIMIT:
        limit = min(max(1, limit), MAX_LIMIT)

    # Filters and sort
    filters = _parse_filters()
    sort_by, order = _parse_sort()
    cursor = request.args.get('cursor', type=str)

    # Build list and apply filters
    items = list(_apply_filters(_predictions_store, **filters))

    # Sort
    reverse = order == 'desc'
    def sort_key(x):
        val = x.get(sort_by)
        if val is None:
            return '' if sort_by == 'label' else 0
        return val
    try:
        items = sorted(items, key=sort_key, reverse=reverse)
    except TypeError:
        items = sorted(items, key=lambda x: str(sort_key(x)), reverse=reverse)

    # Cursor-based slice
    if cursor:
        decoded = _decode_cursor(cursor)
        if decoded:
            try:
                # Cursor format: "sort_value:id" for stable pagination
                parts = decoded.split(':', 1)
                cursor_id = parts[-1]
                idx = next((i for i, p in enumerate(items) if p.get('id') == cursor_id), None)
                if idx is not None:
                    items = items[idx + 1:idx + 1 + limit]
                    next_cursor = _encode_cursor(f"{sort_key(items[-1])}:{items[-1]['id']}") if len(items) == limit else None
                    return jsonify({
                        'predictions': items,
                        'next_cursor': next_cursor,
                        'prev_cursor': None,
                        'limit': limit,
                        'count': len(items),
                    })
            except (IndexError, KeyError):
                pass
        # Invalid cursor: fall back to offset pagination

    # Offset-based slice
    start = (page - 1) * limit
    slice_items = items[start:start + limit]
    total = len(items)

    # Next/prev cursor for consistency (so client can switch to cursor mode)
    next_cursor = None
    prev_cursor = None
    if len(slice_items) == limit and start + limit < total:
        last = slice_items[-1]
        next_cursor = _encode_cursor(f"{sort_key(last)}:{last['id']}")
    if start > 0 and slice_items:
        first = slice_items[0]
        prev_cursor = _encode_cursor(f"{sort_key(first)}:{first['id']}")

    return jsonify({
        'predictions': slice_items,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'total_pages': (total + limit - 1) // limit if limit else 0,
        },
        'next_cursor': next_cursor,
        'prev_cursor': prev_cursor,
        'count': len(slice_items),
    })


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
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
