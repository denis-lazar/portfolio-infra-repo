FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir pytest httpx pytest-asyncio

# We only copy the tests folder
COPY tests/ /app/tests/
COPY pytest.ini /app/

# The tester needs to know where the backend is
ENV BACKEND_URL=http://backend:8000
ENV PYTHONPATH=/app

CMD ["pytest"]
