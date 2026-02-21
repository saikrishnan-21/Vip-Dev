"""
Embedding Models
Pydantic models for embedding generation requests and responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class GenerateArticleEmbeddingRequest(BaseModel):
    """Request to generate embedding for an article"""

    article_id: str = Field(..., description="MongoDB article ID")
    title: str = Field(..., description="Article title")
    content: str = Field(..., description="Article content to embed")
    model: Optional[str] = Field(
        default="nomic-embed-text",
        description="Ollama embedding model to use"
    )


class GenerateArticleEmbeddingResponse(BaseModel):
    """Response from generating article embedding"""

    success: bool = Field(..., description="Whether the operation was successful")
    article_id: str = Field(..., description="MongoDB article ID")
    embedding: List[float] = Field(..., description="Generated embedding vector")
    model: str = Field(..., description="Model used for embedding generation")
    weaviate_uuid: Optional[str] = Field(None, description="Weaviate object UUID")
    action: Optional[str] = Field(None, description="Action taken (created/updated)")
    error: Optional[str] = Field(None, description="Error message if failed")


class SearchSimilarRequest(BaseModel):
    """Request to search for similar articles"""

    query_text: str = Field(..., description="Query text to find similar articles")
    limit: int = Field(default=10, ge=1, le=100, description="Maximum number of results")
    certainty: float = Field(default=0.7, ge=0.0, le=1.0, description="Minimum similarity score")
    model: Optional[str] = Field(
        default="nomic-embed-text",
        description="Ollama embedding model to use"
    )


class SimilarArticle(BaseModel):
    """Similar article result"""

    article_id: str = Field(..., alias="articleId", description="MongoDB article ID")
    title: str = Field(..., description="Article title")
    certainty: float = Field(..., description="Similarity score (0-1)")


class SearchSimilarResponse(BaseModel):
    """Response from similarity search"""

    success: bool = Field(..., description="Whether the operation was successful")
    query: str = Field(..., description="Original query text")
    results: List[SimilarArticle] = Field(..., description="List of similar articles")
    count: int = Field(..., description="Number of results returned")
    error: Optional[str] = Field(None, description="Error message if failed")
