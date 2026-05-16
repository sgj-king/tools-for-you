FROM golang:1.24.2-alpine AS builder

WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY cmd ./cmd
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -mod=mod -trimpath -ldflags="-s -w" -o /out/service ./cmd/server

FROM alpine:3.20
RUN adduser -D -u 10001 app && apk add --no-cache ca-certificates wget
WORKDIR /app
COPY --from=builder /out/service /app/service
USER app
EXPOSE 8080
ENTRYPOINT ["/app/service"]
