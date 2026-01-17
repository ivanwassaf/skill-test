# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files and source code
COPY go.mod main.go ./

# Download dependencies and generate go.sum
RUN go mod download
RUN go mod tidy

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o pdf-service .

# Run stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/pdf-service .

EXPOSE 8080

CMD ["./pdf-service"]
