/**
 * Embeddings Service
 * Generates vector embeddings for text using AI service (Ollama)
 */

const AI_SERVICE_URL = process.env.FASTAPI_AI_SERVICE_URL || 'http://localhost:8000';

export interface EmbeddingRequest {
  text: string;
  model?: string; // Default: 'nomic-embed-text'
}

export interface EmbeddingResponse {
  success: boolean;
  embedding?: number[];
  model?: string;
  error?: string;
}

/**
 * Generate embedding vector for a piece of text
 * Uses FastAPI AI service which calls Ollama
 */
export async function generateEmbedding(
  text: string,
  model: string = 'nomic-embed-text'
): Promise<EmbeddingResponse> {
  try {
    // Truncate text if too long (most embedding models have token limits)
    const truncatedText = text.slice(0, 8000);

    const response = await fetch(`${AI_SERVICE_URL}/api/embeddings/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: truncatedText,
        model,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || `AI service error: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      embedding: data.embedding,
      model: data.model || model,
    };
  } catch (error) {
    console.error('Generate embedding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate embedding',
    };
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  model: string = 'nomic-embed-text'
): Promise<{
  success: boolean;
  embeddings?: number[][];
  errors?: string[];
}> {
  try {
    const results = await Promise.allSettled(
      texts.map((text) => generateEmbedding(text, model))
    );

    const embeddings: number[][] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.embedding) {
        embeddings.push(result.value.embedding);
      } else {
        const error = result.status === 'rejected'
          ? result.reason
          : result.value.error || 'Unknown error';
        errors.push(`Text ${index}: ${error}`);
        embeddings.push([]); // Placeholder for failed embedding
      }
    });

    return {
      success: errors.length === 0,
      embeddings,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Generate embeddings batch error:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to generate embeddings'],
    };
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Prepare text for embedding generation
 * Combines title and content with proper formatting
 */
export function prepareTextForEmbedding(title: string, content: string): string {
  // Clean and format text for embedding
  const cleanTitle = title.trim();
  const cleanContent = content
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace

  return `${cleanTitle}\n\n${cleanContent}`;
}
