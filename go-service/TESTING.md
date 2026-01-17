# Testing the Go PDF Service

## Important Note

The Go PDF service consumes the Node.js backend API endpoint `/api/v1/students/:id`, which requires authentication. There are several ways to test this service:

## Option 1: Test via Frontend Integration (Recommended)

The PDF service can be integrated into the frontend by adding a "Download Report" button in the student details page that calls:

```javascript
window.open(`http://localhost:8080/api/v1/students/${studentId}/report`, '_blank');
```

Since the frontend already has authentication, you can create a proxy endpoint in the backend that the Go service can call.

## Option 2: Create a Public Internal Endpoint

Add a new endpoint in the backend that's only accessible from the Docker network (not exposed publicly) specifically for the PDF service to use.

## Option 3: Direct Testing with Authentication

For direct testing, you would need to:

1. Login to get an access token
2. Modify the Go service to accept and forward authentication headers

## Current Architecture

```
User -> Frontend (authenticated) -> Backend API (protected)
                                         ^
                                         |
PDF Service ---(needs auth token)-------+
```

## Testing Without Auth (Demo Purpose)

If you want to test without modifying authentication, you can temporarily disable the authentication middleware for the students endpoint in the backend for testing purposes only:

In `backend/src/modules/students/students-router.js`, you could temporarily comment out the `authenticateToken` middleware.

**WARNING**: This should NEVER be done in production!

## Verification

The service is running correctly if:
1. Health check responds: `curl http://localhost:8080/health`
2. Logs show: "Go PDF Service starting on port 8080"
3. Docker container is healthy: `docker ps | grep pdf-service`

## Production Solution

For production use, implement one of these approaches:

1. **Service-to-Service Authentication**: Create an internal API key that the PDF service uses
2. **Proxy Endpoint**: Create a backend endpoint that handles authentication and then calls the PDF service
3. **Frontend Integration**: Let the authenticated frontend request PDFs directly and pass through credentials

The current implementation demonstrates the PDF generation capability. Authentication integration depends on your specific security requirements.
