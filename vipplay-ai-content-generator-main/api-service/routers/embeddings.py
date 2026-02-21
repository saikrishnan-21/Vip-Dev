"""
Embeddings API Router
Handles text embedding generation using Ollama
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import ollama
import os
import logging
from models.embedding_models import (
    GenerateArticleEmbeddingRequest,
    GenerateArticleEmbeddingResponse,
    SearchSimilarRequest,
    SearchSimilarResponse,
)
from services.weaviate_service import weaviate_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/embeddings", tags=["embeddings"])

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")


class EmbeddingRequest(BaseModel):
    text: str
    model: str | None = None


class EmbeddingResponse(BaseModel):
    embedding: list[float]
    model: str


@router.post("/generate", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    """
    Generate embedding vector for input text using Ollama
    """
    try:
        model = request.model or EMBEDDING_MODEL

        # Generate embedding using Ollama
        response = ollama.embeddings(
            model=model,
            prompt=request.text,
        )

        if not response or "embedding" not in response:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate embedding: Invalid response from Ollama"
            )

        return EmbeddingResponse(
            embedding=response["embedding"],
            model=model
        )

    except ollama.ResponseError as e:
        logger.error(f"Ollama error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Ollama service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Embedding generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate embedding: {str(e)}"
        )


@router.post("/article", response_model=GenerateArticleEmbeddingResponse)
async def generate_article_embedding(request: GenerateArticleEmbeddingRequest):
    """
    Generate embedding for an article and store it in Weaviate

    This endpoint:
    1. Generates embedding vector using Ollama
    2. Stores the vector in Weaviate with article metadata
    3. Returns the embedding and Weaviate UUID

    Args:
        request: GenerateArticleEmbeddingRequest with article data

    Returns:
        GenerateArticleEmbeddingResponse with success status and embedding

    Status Codes:
        200: Embedding generated and stored successfully
        400: Invalid request parameters
        503: Ollama or Weaviate service unavailable
        500: Internal server error
    """
    try:
        model = request.model or EMBEDDING_MODEL

        logger.info(f"Generating embedding for article {request.article_id}")

        # Combine title and content for embedding
        text_to_embed = f"{request.title}\n\n{request.content}"

        # Generate embedding using Ollama
        response = ollama.embeddings(
            model=model,
            prompt=text_to_embed,
        )

        if not response or "embedding" not in response:
            return GenerateArticleEmbeddingResponse(
                success=False,
                article_id=request.article_id,
                embedding=[],
                model=model,
                error="Failed to generate embedding: Invalid response from Ollama"
            )

        embedding_vector = response["embedding"]

        # Store in Weaviate
        store_result = await weaviate_service.store_embedding(
            article_id=request.article_id,
            title=request.title,
            content=request.content,
            embedding=embedding_vector,
        )

        if not store_result.get("success"):
            return GenerateArticleEmbeddingResponse(
                success=False,
                article_id=request.article_id,
                embedding=embedding_vector,
                model=model,
                error=f"Failed to store in Weaviate: {store_result.get('error')}"
            )

        logger.info(f"Successfully generated and stored embedding for article {request.article_id}")

        return GenerateArticleEmbeddingResponse(
            success=True,
            article_id=request.article_id,
            embedding=embedding_vector,
            model=model,
            weaviate_uuid=store_result.get("uuid"),
            action=store_result.get("action"),
        )

    except ollama.ResponseError as e:
        logger.error(f"Ollama error: {str(e)}")
        return GenerateArticleEmbeddingResponse(
            success=False,
            article_id=request.article_id,
            embedding=[],
            model=model,
            error=f"Ollama service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Article embedding generation error: {str(e)}")
        return GenerateArticleEmbeddingResponse(
            success=False,
            article_id=request.article_id,
            embedding=[],
            model=model or EMBEDDING_MODEL,
            error=f"Failed to generate article embedding: {str(e)}"
        )


@router.post("/search", response_model=SearchSimilarResponse)
async def search_similar_articles(request: SearchSimilarRequest):
    """
    Search for similar articles using vector similarity

    This endpoint:
    1. Generates embedding for the query text
    2. Searches Weaviate for similar article vectors
    3. Returns list of similar articles with scores

    Args:
        request: SearchSimilarRequest with query text and parameters

    Returns:
        SearchSimilarResponse with similar articles

    Status Codes:
        200: Search completed successfully
        400: Invalid request parameters
        503: Ollama or Weaviate service unavailable
        500: Internal server error
    """
    try:
        model = request.model or EMBEDDING_MODEL

        logger.info(f"Searching similar articles for query: {request.query_text[:50]}...")

        # Generate embedding for query text
        response = ollama.embeddings(
            model=model,
            prompt=request.query_text,
        )

        if not response or "embedding" not in response:
            return SearchSimilarResponse(
                success=False,
                query=request.query_text,
                results=[],
                count=0,
                error="Failed to generate query embedding"
            )

        query_vector = response["embedding"]

        # Search Weaviate for similar articles
        similar_articles = await weaviate_service.search_similar(
            query_vector=query_vector,
            limit=request.limit,
            certainty=request.certainty,
        )

        logger.info(f"Found {len(similar_articles)} similar articles")

        return SearchSimilarResponse(
            success=True,
            query=request.query_text,
            results=similar_articles,
            count=len(similar_articles),
        )

    except ollama.ResponseError as e:
        logger.error(f"Ollama error: {str(e)}")
        return SearchSimilarResponse(
            success=False,
            query=request.query_text,
            results=[],
            count=0,
            error=f"Ollama service error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Similar search error: {str(e)}")
        return SearchSimilarResponse(
            success=False,
            query=request.query_text,
            results=[],
            count=0,
            error=f"Failed to search similar articles: {str(e)}"
        )
