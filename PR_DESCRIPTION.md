# Fix #49: No Authentication/Authorization

## Summary
This PR addresses the security vulnerability "No Authentication/Authorization" (Issue #49). It implements a comprehensive security layer for the Backend API, including JWT-based authentication, API key management, and role-based access control (RBAC).

## Changes Made

### ✅ Backend API
- **Location**: `ml-model-api/app.py`
- **Tech Stack**: `Flask-JWT-Extended`, `Flask-SQLAlchemy`, `Flask-Bcrypt`
- **Features**:
  - **User Management**: Registration (`/register`) and Login (`/login`) endpoints.
  - **Authentication**: JWT token generation and validation.
  - **API Keys**: Unique API key generation for each user.
  - **Authorization**: `@role_required` and `@api_key_or_jwt_required` decorators.
  - **Database**: SQLite integration for user storage.

### ✅ Dependencies
- **Location**: `ml-model-api/requirements.txt`
- **Changes**: Added `flask-jwt-extended`, `flask-sqlalchemy`, `flask-bcrypt`.

## Technical Implementation Details

### Authentication Flow
1. **Register**: `POST /register` creates a user and returns an API Key.
2. **Login**: `POST /login` returns a JWT access token.
3. **Access**: Protected endpoints (e.g., `/predict`) require `Authorization: Bearer <token>` header or `X-API-KEY` header.

### Security Measures
```python
# Hybrid Authentication Decorator
def api_key_or_jwt_required(fn):
    @wraps(fn)
    def decorator(*args, **kwargs):
        if verify_api_key(): return fn(*args, **kwargs)
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return decorator
```

### Error Display Components
- Inline errors for form-level feedback
- Modal errors for critical issues
- Toast notifications for temporary alerts

## Acceptance Criteria Met

- ✅ **Implement API key authentication**
- ✅ **Add user registration/login**
- ✅ **Role-based access control**
- ✅ **JWT token management**

## Impact

This update secures the ML inference API, preventing unauthorized access and enabling usage tracking via API keys.

Closes #49
