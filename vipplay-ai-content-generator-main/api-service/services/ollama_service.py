"""
Ollama Service
Direct integration with Ollama for LLM operations
"""

import ollama
import os
import logging
import httpx
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://44.197.16.15:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "ollama/qwen2.5:3b")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "4096"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))
TOP_P = float(os.getenv("TOP_P", "0.9"))


class OllamaService:
    """Service for interacting with Ollama API"""

    def __init__(self, base_url: str = OLLAMA_BASE_URL):
        self.base_url = base_url
        self.client = ollama.Client(host=base_url)
        self._connection_validated = False
        
    async def _validate_connection(self) -> Dict[str, Any]:
        """
        Validate Ollama connection with detailed diagnostics
        
        Returns:
            Dict with connection status and diagnostics
        """
        diagnostics = {
            "connected": False,
            "base_url": self.base_url,
            "errors": [],
            "suggestions": []
        }
        
        try:
            # Test HTTP connection
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    # Try to reach Ollama API
                    response = await client.get(f"{self.base_url}/api/tags")
                    if response.status_code == 200:
                        diagnostics["connected"] = True
                        diagnostics["message"] = "Ollama connection successful"
                        return diagnostics
                    else:
                        diagnostics["errors"].append(
                            f"Ollama returned status code {response.status_code}"
                        )
            except httpx.ConnectError as e:
                diagnostics["errors"].append(f"Connection refused: {str(e)}")
                diagnostics["suggestions"].extend([
                    "1. Check if Ollama is running: `ollama serve` or check service status",
                    f"2. Verify Ollama URL is correct: {self.base_url}",
                    "3. If Ollama is on a remote server, check network connectivity",
                    "4. Check firewall rules allow connections to Ollama port (11434)"
                ])
            except httpx.TimeoutException:
                diagnostics["errors"].append("Connection timeout")
                diagnostics["suggestions"].extend([
                    "1. Ollama server may be overloaded or unresponsive",
                    "2. Check network latency to Ollama server",
                    "3. Increase timeout if Ollama is slow to respond"
                ])
            except Exception as e:
                diagnostics["errors"].append(f"Unexpected error: {str(e)}")
                
        except Exception as e:
            diagnostics["errors"].append(f"Connection validation failed: {str(e)}")
        
        return diagnostics

    async def generate(
        self,
        prompt: str,
        model: str = DEFAULT_MODEL,
        system: Optional[str] = None,
        temperature: float = TEMPERATURE,
        max_tokens: int = MAX_TOKENS,
        top_p: float = TOP_P,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Generate text completion using Ollama

        Args:
            prompt: The input prompt
            model: Model to use for generation
            system: Optional system message
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            top_p: Nucleus sampling parameter
            stream: Whether to stream the response

        Returns:
            Generated response
        """
        try:
            # Validate connection if not already validated
            if not self._connection_validated:
                diagnostics = await self._validate_connection()
                if not diagnostics["connected"]:
                    error_msg = (
                        f"Ollama connection failed. URL: {self.base_url}\n"
                        f"Errors: {', '.join(diagnostics['errors'])}\n"
                        f"Please check Ollama is running and accessible."
                    )
                    logger.error(error_msg)
                    if diagnostics.get("suggestions"):
                        logger.error("Suggestions:\n  " + "\n  ".join(diagnostics["suggestions"]))
                    return {
                        "success": False,
                        "error": error_msg,
                        "diagnostics": diagnostics
                    }
                self._connection_validated = True
            
            # Strip 'ollama/' prefix if present - CrewAI/LiteLLM uses this prefix,
            # but the Ollama Python client expects just the model name
            clean_model = model.replace("ollama/", "") if model.startswith("ollama/") else model
            
            # Validate model exists before attempting generation
            model_exists = await self.model_exists(clean_model)
            if not model_exists:
                available_models = await self.list_models()
                model_names = [m["name"] for m in available_models]
                error_msg = (
                    f"Model '{clean_model}' not found on Ollama server.\n"
                    f"Available models: {', '.join(model_names[:10])}"
                    + (f" and {len(model_names) - 10} more" if len(model_names) > 10 else "")
                    + f"\nPlease pull the model: ollama pull {clean_model}"
                )
                logger.error(error_msg)
                return {
                    "success": False,
                    "error": error_msg,
                    "available_models": model_names
                }
            
            options = {
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": top_p,
            }

            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            # Langfuse tracing (gracefully handles disabled/misconfigured Langfuse)
            trace = None
            try:
                from services.langfuse_service import get_langfuse_client, is_langfuse_enabled
                if is_langfuse_enabled():
                    langfuse_client = get_langfuse_client()
                    if langfuse_client:
                        try:
                            trace = langfuse_client.trace(
                                name="ollama_generate",
                                metadata={
                                    "model": clean_model,
                                    "temperature": temperature,
                                    "max_tokens": max_tokens,
                                    "top_p": top_p
                                }
                            )
                        except Exception as e:
                            logger.warning(f"Failed to create Langfuse trace: {str(e)}")
            except Exception as langfuse_error:
                # If Langfuse import or initialization fails, continue without tracing
                logger.debug(f"Langfuse not available: {str(langfuse_error)}")

            response = self.client.chat(
                model=clean_model,
                messages=messages,
                options=options,
                stream=stream
            )

            if stream:
                return response

            # Trace LLM call if Langfuse trace exists
            if trace:
                try:
                    span = trace.span(name="ollama_chat")
                    span.generation(
                        name="ollama_generation",
                        model=clean_model,
                        input=messages,
                        output=response["message"]["content"],
                        usage={
                            "prompt_tokens": response.get("prompt_eval_count", 0),
                            "completion_tokens": response.get("eval_count", 0),
                            "total_tokens": response.get("prompt_eval_count", 0) + response.get("eval_count", 0)
                        }
                    )
                    span.end()
                except Exception as e:
                    logger.warning(f"Failed to trace LLM call: {str(e)}")

            return {
                "success": True,
                "content": response["message"]["content"],
                "model": clean_model,
                "tokens": {
                    "prompt": response.get("prompt_eval_count", 0),
                    "completion": response.get("eval_count", 0),
                    "total": response.get("prompt_eval_count", 0) + response.get("eval_count", 0)
                }
            }

        except ConnectionError as e:
            error_msg = (
                f"Ollama connection error: {str(e)}\n"
                f"URL: {self.base_url}\n"
                f"Please verify Ollama is running and accessible at this URL."
            )
            logger.error(error_msg)
            self._connection_validated = False
            return {
                "success": False,
                "error": error_msg
            }
        except Exception as e:
            error_msg = f"Ollama generation error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }

    async def generate_embedding(
        self,
        text: str,
        model: str = EMBEDDING_MODEL
    ) -> Dict[str, Any]:
        """
        Generate embedding vector for text

        Args:
            text: Input text
            model: Embedding model to use

        Returns:
            Embedding vector
        """
        try:
            response = self.client.embeddings(
                model=model,
                prompt=text
            )

            return {
                "success": True,
                "embedding": response["embedding"],
                "model": model
            }

        except Exception as e:
            logger.error(f"Ollama embedding error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def list_models(self) -> List[Dict[str, Any]]:
        """
        List available Ollama models

        Returns:
            List of available models
        """
        try:
            response = self.client.list()
            models = []

            for model in response.get("models", []):
                models.append({
                    "name": model.get("name") or model.get("model") or "unknown",
                    "size": model.get("size", 0),
                    "modified": model.get("modified_at", ""),
                    "digest": model.get("digest", "")
                })

            return models

        except Exception as e:
            logger.error(f"Ollama list models error: {str(e)}")
            return []
    
    async def model_exists(self, model_name: str) -> bool:
        """
        Check if a model exists on the Ollama server
        
        Args:
            model_name: Model name to check (with or without 'ollama/' prefix)
            
        Returns:
            True if model exists, False otherwise
        """
        try:
            # Strip 'ollama/' prefix if present
            clean_model = model_name.replace("ollama/", "") if model_name.startswith("ollama/") else model_name
            
            models = await self.list_models()
            model_names = [m["name"] for m in models]
            
            # Check if exact match or if model name starts with the clean model name
            # (handles cases like "llama3.1:8b" vs "llama3.1")
            exists = any(
                clean_model == m or m.startswith(clean_model.split(":")[0])
                for m in model_names
            )
            
            if not exists:
                logger.warning(
                    f"Model '{clean_model}' not found. Available models: {', '.join(model_names[:5])}"
                    + (f" and {len(model_names) - 5} more" if len(model_names) > 5 else "")
                )
            
            return exists
        except Exception as e:
            logger.error(f"Error checking if model exists: {str(e)}")
            return False

    async def check_health(self) -> bool:
        """
        Check if Ollama server is healthy

        Returns:
            True if healthy, False otherwise
        """
        try:
            # First validate connection
            diagnostics = await self._validate_connection()
            if not diagnostics["connected"]:
                logger.error(
                    f"Ollama health check failed:\n"
                    f"  URL: {diagnostics['base_url']}\n"
                    f"  Errors: {', '.join(diagnostics['errors'])}\n"
                    f"  Suggestions:\n    " + "\n    ".join(diagnostics.get('suggestions', []))
                )
                return False
            
            # Try to list models as a health check
            models = await self.list_models()
            if models:
                self._connection_validated = True
                return True
            else:
                logger.warning("Ollama connected but no models found")
                return False
        except Exception as e:
            logger.error(f"Ollama health check failed: {str(e)}")
            # Try to get connection diagnostics
            try:
                diagnostics = await self._validate_connection()
                if diagnostics.get("suggestions"):
                    logger.error("Connection diagnostics:\n  " + "\n  ".join(diagnostics["suggestions"]))
            except:
                pass
            return False

    async def pull_model(self, model_name: str) -> Dict[str, Any]:
        """
        Pull a model from Ollama registry

        Args:
            model_name: Name of the model to pull

        Returns:
            Pull status
        """
        try:
            response = self.client.pull(model_name)
            return {
                "success": True,
                "model": model_name,
                "status": response.get("status", "")
            }
        except Exception as e:
            logger.error(f"Ollama pull model error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# Global service instance
ollama_service = OllamaService()
