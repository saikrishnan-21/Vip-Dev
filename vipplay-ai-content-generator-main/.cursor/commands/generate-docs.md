# Generate Documentation

Generate comprehensive documentation for code, APIs, components, or features.

## Requirements

1. **Clear and concise** - Easy to understand
2. **Comprehensive** - Cover all aspects
3. **Examples included** - Show usage
4. **Up-to-date** - Match current code
5. **Well-structured** - Organized sections

## Documentation Types

### 1. API Documentation
- Endpoint description
- Request/response schemas
- Authentication requirements
- Status codes
- Error responses
- Usage examples

### 2. Component Documentation
- Props interface
- Usage examples
- Styling options
- Event handlers
- Accessibility notes

### 3. Function Documentation
- Purpose and behavior
- Parameters with types
- Return value
- Exceptions/errors
- Usage examples

### 4. Feature Documentation
- Overview
- User flow
- Technical implementation
- Configuration
- Examples

## Templates

### API Endpoint Documentation
```markdown
# POST /api/content/generate

Generate AI content based on topic and parameters.

## Authentication
Requires: User authentication (JWT token)

## Request Body
\`\`\`typescript
{
  topic: string;           // Content topic (3-200 chars)
  word_count: number;      // Target word count (100-5000)
  tone: "professional" | "casual" | "formal";
  include_seo: boolean;    // Include SEO optimization
}
\`\`\`

## Response
\`\`\`typescript
{
  success: true,
  data: {
    content: string;
    word_count: number;
    seo_score: number;
    readability_score: number;
  }
}
\`\`\`

## Status Codes
- 201: Content generated successfully
- 400: Invalid request parameters
- 401: Authentication required
- 500: Generation failed

## Example
\`\`\`typescript
const response = await fetch('/api/content/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: "Fantasy Football Draft Strategies",
    word_count: 1500,
    tone: "professional",
    include_seo: true
  })
});
\`\`\`
```

### Component Documentation
```markdown
# UserCard Component

Displays user information in a card format.

## Props
\`\`\`typescript
interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}
\`\`\`

## Usage
\`\`\`tsx
import { UserCard } from '@/components/UserCard';

<UserCard 
  user={user}
  onEdit={() => handleEdit(user.id)}
  onDelete={() => handleDelete(user.id)}
  className="mb-4"
/>
\`\`\`

## Accessibility
- Uses semantic HTML
- Keyboard navigable
- Screen reader friendly
- ARIA labels included
```

### Function Documentation
```python
def generate_content(
    topic: str,
    word_count: int = 1500,
    tone: str = "professional"
) -> Dict[str, Any]:
    """
    Generate AI content using CrewAI agents.
    
    Args:
        topic: The content topic (3-200 characters)
        word_count: Target word count (default: 1500, range: 100-5000)
        tone: Writing tone (default: "professional", options: "professional", "casual", "formal")
    
    Returns:
        Dict containing:
            - content (str): Generated content
            - word_count (int): Actual word count
            - seo_score (float): SEO score (0-100)
            - metadata (dict): Additional metadata
    
    Raises:
        ValueError: If topic is empty or word_count out of range
        OllamaServiceError: If Ollama service is unavailable
        Exception: For other generation failures
    
    Example:
        >>> result = generate_content("Python Best Practices", 1000, "professional")
        >>> print(result["content"])
        "Python is a versatile programming language..."
    """
```

## Usage Example

```
/generate-docs
Generate API documentation for the content generation endpoints
in app/api/content/
```

## What to Include

### For APIs:
- Endpoint URL and method
- Authentication requirements
- Request/response schemas
- Status codes and errors
- Usage examples with curl/fetch
- Rate limiting info

### For Components:
- Component purpose
- Props interface
- Usage examples
- Styling options
- Accessibility features
- Browser support

### For Functions:
- Docstring with description
- Parameters with types
- Return value description
- Possible exceptions
- Usage examples
- Performance notes

### For Features:
- Feature overview
- User stories covered
- Architecture diagram
- Setup instructions
- Configuration options
- Known limitations

## Best Practices

- ✅ Use clear, simple language
- ✅ Include code examples
- ✅ Show both success and error cases
- ✅ Document edge cases
- ✅ Keep docs near code
- ✅ Update docs with code changes
- ✅ Use consistent formatting
- ✅ Add diagrams for complex flows
- ❌ Don't assume prior knowledge
- ❌ Don't skip error handling docs
- ❌ Don't forget accessibility notes

