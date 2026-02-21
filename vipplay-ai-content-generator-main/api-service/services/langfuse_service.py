"""
Langfuse Service
LLM observability and tracing integration
"""

import os
import logging
from typing import Optional, Dict, Any
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Langfuse configuration
LANGFUSE_PUBLIC_KEY = os.getenv("LANGFUSE_PUBLIC_KEY")
LANGFUSE_SECRET_KEY = os.getenv("LANGFUSE_SECRET_KEY")
LANGFUSE_HOST = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
LANGFUSE_ENABLED = os.getenv("LANGFUSE_ENABLED", "false").lower() == "true"

# Initialize Langfuse client (lazy loading)
_langfuse_client = None
_langfuse_tracer = None


def get_langfuse_client():
    """Get or initialize Langfuse client (singleton pattern)"""
    global _langfuse_client
    
    if not LANGFUSE_ENABLED:
        return None
    
    if _langfuse_client is None:
        try:
            from langfuse import Langfuse
            
            if not LANGFUSE_PUBLIC_KEY or not LANGFUSE_SECRET_KEY:
                logger.warning("Langfuse keys not configured. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to enable.")
                return None
            
            _langfuse_client = Langfuse(
                public_key=LANGFUSE_PUBLIC_KEY,
                secret_key=LANGFUSE_SECRET_KEY,
                host=LANGFUSE_HOST,
            )
            logger.info(f"Langfuse client initialized (host: {LANGFUSE_HOST})")
        except ImportError:
            logger.warning("Langfuse package not installed. Install with: pip install langfuse")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize Langfuse client: {str(e)}")
            return None
    
    return _langfuse_client


def get_langfuse_tracer():
    """Get Langfuse tracer for automatic tracing"""
    global _langfuse_tracer
    
    if not LANGFUSE_ENABLED:
        return None
    
    if _langfuse_tracer is None:
        try:
            from langfuse.decorators import langfuse_context
            
            client = get_langfuse_client()
            if client is None:
                return None
            
            _langfuse_tracer = langfuse_context
            logger.info("Langfuse tracer initialized")
        except ImportError:
            logger.warning("Langfuse decorators not available")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize Langfuse tracer: {str(e)}")
            return None
    
    return _langfuse_tracer


@contextmanager
def trace_generation(
    trace_name: str,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    tags: Optional[list] = None
):
    """
    Context manager for tracing content generation operations.
    
    Usage:
        with trace_generation("article_generation", user_id="user123", metadata={"topic": "Fantasy Football"}):
            # Your generation code here
            pass
    """
    client = get_langfuse_client()
    
    if client is None:
        yield None
        return
    
    try:
        trace = client.trace(
            name=trace_name,
            user_id=user_id,
            metadata=metadata or {},
            tags=tags or []
        )
        yield trace
    except Exception as e:
        logger.error(f"Langfuse trace error: {str(e)}")
        yield None


def trace_llm_call(
    trace: Any,
    span_name: str,
    model: str,
    messages: list,
    response: str,
    tokens_used: Optional[Dict[str, int]] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Create a span for an LLM call within a trace.
    
    Args:
        trace: Langfuse trace object
        span_name: Name of the span (e.g., "researcher_agent", "writer_agent")
        model: Model name used
        messages: List of messages sent to the LLM
        response: Response from the LLM
        tokens_used: Dict with 'prompt', 'completion', 'total' token counts
        metadata: Additional metadata
    """
    if trace is None:
        return
    
    try:
        span = trace.span(
            name=span_name,
            metadata={
                "model": model,
                **(metadata or {})
            }
        )
        
        # Create generation event
        span.generation(
            name=f"{span_name}_generation",
            model=model,
            input=messages,
            output=response,
            usage={
                "prompt_tokens": tokens_used.get("prompt", 0) if tokens_used else 0,
                "completion_tokens": tokens_used.get("completion", 0) if tokens_used else 0,
                "total_tokens": tokens_used.get("total", 0) if tokens_used else 0,
            } if tokens_used else None
        )
        
        span.end()
    except Exception as e:
        logger.error(f"Langfuse span error: {str(e)}")


def is_langfuse_enabled() -> bool:
    """Check if Langfuse is enabled and configured"""
    return LANGFUSE_ENABLED and LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY

