#!/usr/bin/env python
import uvicorn
import sys

if __name__ == "__main__":
    # Run the FastAPI application
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on file changes
        log_level="info"
    )
