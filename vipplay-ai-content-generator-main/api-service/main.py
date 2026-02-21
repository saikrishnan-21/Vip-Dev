"""
VIPContentAI - FastAPI AI Microservice
Main application entry point
"""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError
from typing import Optional
import os
import logging
import traceback
import sys
from datetime import datetime
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

# Load environment variables
load_dotenv()

# Import routers and services
from routers import embeddings, generation, crawl, rss, images, videos
from services.ollama_service import ollama_service

# Setup logs directory
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Configure logging with date/time-based file logging
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
log_format = "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
date_format = "%Y-%m-%d %H:%M:%S"

# Create formatters
formatter = logging.Formatter(log_format, datefmt=date_format)

# Console handler (stdout)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(getattr(logging, log_level, logging.INFO))
console_handler.setFormatter(formatter)

# Main log file handler (rotates daily at midnight)
log_file = log_dir / "app.log"
file_handler = TimedRotatingFileHandler(
    filename=str(log_file),
    when="midnight",
    interval=1,
    backupCount=30,  # Keep 30 days of logs
    encoding="utf-8"
)
file_handler.setLevel(getattr(logging, log_level, logging.INFO))
file_handler.setFormatter(formatter)
file_handler.suffix = "%Y-%m-%d"  # Log files will be named: app.log.2025-01-15

# Error log file handler (only errors and above, rotates daily)
error_log_file = log_dir / "error.log"
error_handler = TimedRotatingFileHandler(
    filename=str(error_log_file),
    when="midnight",
    interval=1,
    backupCount=30,  # Keep 30 days of error logs
    encoding="utf-8"
)
error_handler.setLevel(logging.ERROR)  # Only errors and critical
error_handler.setFormatter(formatter)
error_handler.suffix = "%Y-%m-%d"  # Log files will be named: error.log.2025-01-15

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(getattr(logging, log_level, logging.INFO))
root_logger.handlers = []  # Clear existing handlers
root_logger.addHandler(console_handler)
root_logger.addHandler(file_handler)
root_logger.addHandler(error_handler)

# Get logger for this module
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VIPContentAI AI Service",
    description="AI microservice for content generation using CrewAI and Ollama",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").strip()

# Allow all origins if set to "*"
if allowed_origins_env == "*":
    logger.info("CORS: Allowing all origins (*)")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Cannot use credentials with allow_origins=["*"]
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Use specific origins list
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
    logger.info(f"CORS: Allowing origins: {allowed_origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to catch all unhandled exceptions
    Provides detailed error information for debugging
    """
    # Get full traceback
    exc_type, exc_value, exc_traceback = sys.exc_info()
    tb_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
    tb_string = ''.join(tb_lines)
    
    # Log full error details
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}\n"
        f"Path: {request.method} {request.url.path}\n"
        f"Traceback:\n{tb_string}"
    )
    
    # Return detailed error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal Server Error",
            "message": str(exc),
            "type": type(exc).__name__,
            "path": f"{request.method} {request.url.path}",
            "timestamp": datetime.utcnow().isoformat(),
            "traceback": tb_string if os.getenv("LOG_LEVEL", "INFO").upper() == "DEBUG" else None
        }
    )

# HTTPException Handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom handler for HTTPExceptions with detailed logging"""
    logger.warning(
        f"HTTPException: {exc.status_code} - {exc.detail}\n"
        f"Path: {request.method} {request.url.path}"
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": f"{request.method} {request.url.path}",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Custom handler for Pydantic validation errors"""
    # Try to get body for logging (may fail if already consumed)
    body_preview = "N/A"
    try:
        body_bytes = await request.body()
        body_preview = body_bytes.decode('utf-8')[:500] if body_bytes else "Empty"
    except Exception:
        pass
    
    logger.warning(
        f"Validation error: {exc.errors()}\n"
        f"Path: {request.method} {request.url.path}\n"
        f"Body preview: {body_preview}"
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation Error",
            "details": exc.errors(),
            "path": f"{request.method} {request.url.path}",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Request/Response Logging Middleware
@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    """Log all requests and responses with timing"""
    start_time = datetime.utcnow()
    
    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path} | "
        f"Client: {request.client.host if request.client else 'unknown'}"
    )
    
    try:
        response = await call_next(request)
        
        # Calculate duration
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        # Log response
        logger.info(
            f"Response: {request.method} {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Duration: {duration:.3f}s"
        )
        
        return response
    except Exception as e:
        # Log exception in middleware
        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.error(
            f"Exception in middleware: {request.method} {request.url.path} | "
            f"Error: {str(e)} | "
            f"Duration: {duration:.3f}s"
        )
        raise

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        logger.info("=" * 60)
        logger.info("Starting VIPContentAI AI Service")
        logger.info("=" * 60)
        logger.info(f"Ollama URL: {os.getenv('OLLAMA_BASE_URL', 'Not set')}")
        logger.info(f"Default Model: {os.getenv('DEFAULT_MODEL', 'Not set')}")
        logger.info(f"API Host: {os.getenv('API_HOST', '0.0.0.0')}")
        logger.info(f"API Port: {os.getenv('API_PORT', '8000')}")
        logger.info(f"Log Level: {os.getenv('LOG_LEVEL', 'INFO')}")
        logger.info(f"CORS Origins: {os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000')}")
        logger.info(f"Log Files:")
        logger.info(f"  - Main logs: {log_file.absolute()}")
        logger.info(f"  - Error logs: {error_log_file.absolute()}")
        logger.info(f"  - Log rotation: Daily at midnight (keeps 30 days)")
        
        # Verify Ollama connection
        try:
            ollama_healthy = await ollama_service.check_health()
            if ollama_healthy:
                logger.info("✅ Ollama service is healthy")
            else:
                logger.warning("⚠️  Ollama service check returned unhealthy")
        except Exception as e:
            logger.error(f"❌ Failed to verify Ollama connection: {str(e)}")
            logger.error(f"   Traceback: {traceback.format_exc()}")
        
        logger.info("=" * 60)
    except Exception as e:
        logger.critical(f"Startup failed: {str(e)}")
        logger.critical(f"Traceback: {traceback.format_exc()}")
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        logger.info("=" * 60)
        logger.info("Shutting down VIPContentAI AI Service")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Check service health and Ollama connection"""
    try:
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://44.197.16.15:11434")
        ollama_healthy = await ollama_service.check_health()
        
        # Get detailed diagnostics if connection failed
        diagnostics = None
        if not ollama_healthy:
            diagnostics = await ollama_service._validate_connection()
        
        response = {
            "status": "healthy" if ollama_healthy else "degraded",
            "service": "VIPContentAI AI Service",
            "ollama_url": ollama_url,
            "ollama_connected": ollama_healthy,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if diagnostics and not diagnostics.get("connected"):
            response["ollama_diagnostics"] = {
                "errors": diagnostics.get("errors", []),
                "suggestions": diagnostics.get("suggestions", [])
            }
        
        return response
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=503,
            detail=f"Service unhealthy: {str(e)}"
        )

# Ollama diagnostics endpoint
@app.get("/diagnostics/ollama")
async def ollama_diagnostics():
    """Get detailed Ollama connection diagnostics"""
    try:
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://44.197.16.15:11434")
        diagnostics = await ollama_service._validate_connection()
        
        return {
            "ollama_url": ollama_url,
            "environment_variable": os.getenv("OLLAMA_BASE_URL", "NOT SET (using default)"),
            "diagnostics": diagnostics,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Ollama diagnostics failed: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Diagnostics failed: {str(e)}"
        )

# List available models
@app.get("/models")
async def list_models():
    """List available Ollama models"""
    try:
        models = await ollama_service.list_models()
        model_names = [m["name"] for m in models]
        
        return {
            "models": models,
            "count": len(models),
            "model_names": model_names,
            "default_model": os.getenv("DEFAULT_MODEL", "Not set"),
            "ollama_url": os.getenv("OLLAMA_BASE_URL", "Not set"),
            "message": f"Found {len(models)} available model(s)" if models else "No models found. Pull a model using: POST /models/pull"
        }
    except Exception as e:
        logger.error(f"Failed to list models: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to fetch models: {str(e)}"
        )

# Pydantic models for requests
class PullModelRequest(BaseModel):
    """Request model for pulling Ollama model"""
    model: str

class TestModelRequest(BaseModel):
    """Request model for testing Ollama model"""
    model: str
    prompt: Optional[str] = 'Hello, respond with "OK" if you can read this.'

# Pull a new Ollama model
@app.post("/models/pull")
async def pull_model(request: PullModelRequest):
    """Pull a new Ollama model from registry"""
    try:
        result = await ollama_service.pull_model(request.model)
        
        if result.get("success"):
            return {
                "message": f"Model {request.model} is being pulled",
                "model": request.model,
                "status": "pulling"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to pull model")
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to pull model: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to pull model: {str(e)}"
        )

# Test model connection
@app.post("/models/test")
async def test_model(request: TestModelRequest):
    """Test a model connection and response"""
    try:
        import time
        start_time = time.time()
        
        try:
            # Test model with a simple prompt
            result = await ollama_service.generate(
                prompt=request.prompt,
                model=request.model,
                stream=False
            )
            
            response_time = int((time.time() - start_time) * 1000)  # Convert to milliseconds
            
            if result.get("success"):
                return {
                    "message": "Model test successful",
                    "result": {
                        "model": request.model,
                        "success": True,
                        "responseTime": response_time,
                        "response": result.get("content", ""),
                        "testedAt": time.time()
                    }
                }
            else:
                return {
                    "message": "Model test failed",
                    "result": {
                        "model": request.model,
                        "success": False,
                        "responseTime": response_time,
                        "error": result.get("error", "Unknown error"),
                        "testedAt": time.time()
                    }
                }
        except Exception as test_error:
            response_time = int((time.time() - start_time) * 1000)
            return {
                "message": "Model test failed",
                "result": {
                    "model": request.model,
                    "success": False,
                    "responseTime": response_time,
                    "error": str(test_error),
                    "testedAt": time.time()
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to test model: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to test model: {str(e)}"
        )

# Include API routers
app.include_router(embeddings.router)
app.include_router(generation.router)
app.include_router(crawl.router)
app.include_router(rss.router)
app.include_router(images.router)
app.include_router(videos.router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "VIPContentAI AI Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

# TODO: Add generation endpoints
# @app.post("/generate")
# async def generate_content(request: GenerationRequest):
#     """Generate content using CrewAI agents"""
#     pass

if __name__ == "__main__":
    import uvicorn
    workers = int(os.getenv("FASTAPI_WORKERS", "4"))  # Configurable via env, default 4 for multi-user support
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("RELOAD", "false").lower() == "true",
        workers=workers if os.getenv("RELOAD", "false").lower() != "true" else 1,  # Only use workers in production
    )
