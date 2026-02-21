"""
Weaviate Service
Handles vector storage and retrieval operations
"""

import os
import logging
from typing import Dict, Any, List, Optional
import weaviate
from weaviate.classes.init import Auth

logger = logging.getLogger(__name__)


class WeaviateService:
    """Service for interacting with Weaviate vector database"""

    def __init__(self):
        self.weaviate_url = os.getenv("WEAVIATE_URL", "http://localhost:8080")
        self.client = None
        self.collection_name = "Article"

    async def connect(self):
        """Initialize connection to Weaviate"""
        try:
            # Connect to Weaviate instance
            self.client = weaviate.connect_to_custom(
                http_host=self.weaviate_url.replace("http://", "").replace("https://", ""),
                http_port=80 if "http://" in self.weaviate_url else 443,
                http_secure=False if "http://" in self.weaviate_url else True,
                grpc_host=self.weaviate_url.replace("http://", "").replace("https://", ""),
                grpc_port=50051,
                grpc_secure=False if "http://" in self.weaviate_url else True,
            )

            logger.info(f"Connected to Weaviate at {self.weaviate_url}")

            # Ensure schema exists
            await self._ensure_schema()

            return True
        except Exception as e:
            logger.error(f"Failed to connect to Weaviate: {str(e)}")
            raise

    async def _ensure_schema(self):
        """Create Article collection schema if it doesn't exist"""
        try:
            # Check if collection exists
            if not self.client.collections.exists(self.collection_name):
                logger.info(f"Creating {self.collection_name} collection in Weaviate")

                # Create collection with properties
                self.client.collections.create(
                    name=self.collection_name,
                    properties=[
                        {
                            "name": "articleId",
                            "dataType": ["text"],
                            "description": "MongoDB article ID reference",
                        },
                        {
                            "name": "title",
                            "dataType": ["text"],
                            "description": "Article title for reference",
                        },
                        {
                            "name": "content",
                            "dataType": ["text"],
                            "description": "Article content (for context)",
                        },
                    ],
                    vectorizer_config=weaviate.classes.config.Configure.Vectorizer.none(),
                )

                logger.info(f"Created {self.collection_name} collection successfully")
            else:
                logger.info(f"{self.collection_name} collection already exists")
        except Exception as e:
            logger.error(f"Failed to ensure schema: {str(e)}")
            raise

    async def store_embedding(
        self,
        article_id: str,
        title: str,
        content: str,
        embedding: List[float],
    ) -> Dict[str, Any]:
        """
        Store article embedding in Weaviate

        Args:
            article_id: MongoDB article ID
            title: Article title
            content: Article content
            embedding: Vector embedding

        Returns:
            Dict with success status and object UUID
        """
        try:
            if not self.client:
                await self.connect()

            collection = self.client.collections.get(self.collection_name)

            # Check if embedding already exists for this article
            existing = collection.query.fetch_objects(
                filters=weaviate.classes.query.Filter.by_property("articleId").equal(article_id),
                limit=1
            )

            if existing.objects:
                # Update existing embedding
                uuid = existing.objects[0].uuid
                collection.data.update(
                    uuid=uuid,
                    properties={
                        "articleId": article_id,
                        "title": title,
                        "content": content[:1000],  # Truncate content for storage
                    },
                    vector=embedding,
                )
                logger.info(f"Updated embedding for article {article_id}")
                return {
                    "success": True,
                    "uuid": str(uuid),
                    "action": "updated"
                }
            else:
                # Insert new embedding
                uuid = collection.data.insert(
                    properties={
                        "articleId": article_id,
                        "title": title,
                        "content": content[:1000],  # Truncate content for storage
                    },
                    vector=embedding,
                )
                logger.info(f"Stored new embedding for article {article_id}")
                return {
                    "success": True,
                    "uuid": str(uuid),
                    "action": "created"
                }

        except Exception as e:
            logger.error(f"Failed to store embedding: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def get_embedding(self, article_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve embedding for an article

        Args:
            article_id: MongoDB article ID

        Returns:
            Dict with embedding data or None if not found
        """
        try:
            if not self.client:
                await self.connect()

            collection = self.client.collections.get(self.collection_name)

            result = collection.query.fetch_objects(
                filters=weaviate.classes.query.Filter.by_property("articleId").equal(article_id),
                include_vector=True,
                limit=1
            )

            if result.objects:
                obj = result.objects[0]
                return {
                    "uuid": str(obj.uuid),
                    "articleId": obj.properties["articleId"],
                    "title": obj.properties["title"],
                    "vector": obj.vector,
                }

            return None

        except Exception as e:
            logger.error(f"Failed to retrieve embedding: {str(e)}")
            return None

    async def delete_embedding(self, article_id: str) -> bool:
        """
        Delete embedding for an article

        Args:
            article_id: MongoDB article ID

        Returns:
            True if deleted, False otherwise
        """
        try:
            if not self.client:
                await self.connect()

            collection = self.client.collections.get(self.collection_name)

            # Find the object
            result = collection.query.fetch_objects(
                filters=weaviate.classes.query.Filter.by_property("articleId").equal(article_id),
                limit=1
            )

            if result.objects:
                uuid = result.objects[0].uuid
                collection.data.delete_by_id(uuid)
                logger.info(f"Deleted embedding for article {article_id}")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to delete embedding: {str(e)}")
            return False

    async def search_similar(
        self,
        query_vector: List[float],
        limit: int = 10,
        certainty: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar articles by vector

        Args:
            query_vector: Query embedding vector
            limit: Maximum number of results
            certainty: Minimum similarity score (0-1)

        Returns:
            List of similar articles with scores
        """
        try:
            if not self.client:
                await self.connect()

            collection = self.client.collections.get(self.collection_name)

            result = collection.query.near_vector(
                near_vector=query_vector,
                limit=limit,
                return_metadata=weaviate.classes.query.MetadataQuery(certainty=True),
            )

            similar_articles = []
            for obj in result.objects:
                similar_articles.append({
                    "articleId": obj.properties["articleId"],
                    "title": obj.properties["title"],
                    "certainty": obj.metadata.certainty,
                })

            logger.info(f"Found {len(similar_articles)} similar articles")
            return similar_articles

        except Exception as e:
            logger.error(f"Failed to search similar articles: {str(e)}")
            return []

    async def close(self):
        """Close Weaviate connection"""
        if self.client:
            self.client.close()
            logger.info("Closed Weaviate connection")


# Singleton instance
weaviate_service = WeaviateService()
