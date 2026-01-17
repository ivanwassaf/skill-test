# Go PDF Report Service

A microservice written in Go that generates PDF reports for students by consuming the Node.js backend API.

## Features

- Consumes the existing Node.js backend API (`/api/v1/students/:id`)
- Does not connect directly to the database
- Generates professional PDF reports with student information
- RESTful API endpoint for report generation

## Prerequisites

- Go 1.21 or higher
- Running Node.js backend (with PostgreSQL database)

## Installation

```bash
cd go-service
go mod download
```

## Running Locally

```bash
# Make sure the Node.js backend is running on http://localhost:5007
cd go-service
go run main.go
```

The service will start on port 8080 by default.

## Environment Variables

- `BACKEND_URL`: URL of the Node.js backend (default: `http://localhost:5007`)
- `PORT`: Port for the Go service (default: `8080`)

## API Endpoints

### Generate Student PDF Report

```
GET /api/v1/students/:id/report
```

**Example:**
```bash
curl http://localhost:8080/api/v1/students/1/report --output student_report.pdf
```

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "student-pdf-report"
}
```

## Docker

Build the Docker image:
```bash
docker build -t go-pdf-service .
```

Run the container:
```bash
docker run -p 8080:8080 -e BACKEND_URL=http://host.docker.internal:5007 go-pdf-service
```

## PDF Report Contents

The generated PDF includes:

**Personal Information:**
- Name, Roll No, Admission No
- Date of Birth, Gender, Blood Group
- Religion, Caste, Mother Tongue
- Aadhar Card No

**Contact Information:**
- Email, Contact No
- Address, City, State, Pincode

**Academic Information:**
- Class, Section, Department

## Dependencies

- `github.com/gorilla/mux` - HTTP router
- `github.com/jung-kurt/gofpdf` - PDF generation library

## Testing

1. Ensure the PostgreSQL database and Node.js backend are running
2. Start the Go service
3. Use curl or Postman to request a student report:

```bash
curl http://localhost:8080/api/v1/students/1/report --output report.pdf
```

4. Open the downloaded PDF to verify the contents

## Architecture

```
Client -> Go Service -> Node.js Backend API -> PostgreSQL
            |
            v
        PDF File
```

The Go service:
1. Receives a request for student ID
2. Calls the Node.js backend API to fetch student data
3. Generates a formatted PDF report
4. Returns the PDF as a downloadable file

## Error Handling

- Returns 500 if backend API is unreachable
- Returns appropriate error if student not found
- Logs all errors for debugging
