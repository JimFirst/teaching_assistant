"""Performance monitoring middleware."""

import time
import uuid
from typing import Callable

import structlog
from fastapi import Request, Response
from prometheus_client import Counter, Gauge, Histogram
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"],
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0),
)
ACTIVE_REQUESTS = Gauge(
    "http_requests_active",
    "Number of active HTTP requests",
)


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for request monitoring and structured logging."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Track active requests
        ACTIVE_REQUESTS.inc()

        # Record start time
        start_time = time.perf_counter()

        # Extract endpoint pattern for metrics
        endpoint = request.url.path
        method = request.method

        # Process request
        response = None
        error_message = None
        try:
            response = await call_next(request)
        except Exception as e:
            error_message = str(e)
            raise
        finally:
            # Calculate duration
            duration = time.perf_counter() - start_time

            # Get status code
            status_code = response.status_code if response else 500

            # Record metrics
            REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=str(status_code)).inc()
            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)

            # Log request
            log = logger.bind(
                request_id=request_id,
                method=method,
                endpoint=endpoint,
                status_code=status_code,
                duration_ms=round(duration * 1000, 2),
                client_ip=self._get_client_ip(request),
            )

            if status_code >= 500:
                log.error("request_completed_with_error", error=error_message)
            elif status_code >= 400:
                log.warning("request_completed_with_client_error")
            else:
                log.info("request_completed")

        ACTIVE_REQUESTS.dec()

        # Add request ID to response headers
        if response:
            response.headers["X-Request-ID"] = request_id

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
