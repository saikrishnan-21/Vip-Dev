# Create FastAPI Endpoint

Create a new FastAPI endpoint with Pydantic models, proper error handling, and async patterns.

## Requirements

1. **Location**: Create in `api-service/routers/[module].py`
2. **Pydantic Models**: Define request and response schemas
3. **Async**: Use `async def` for all route handlers
4. **Error Handling**: Raise HTTPException with proper status codes
5. **Ollama Integration**: Use OllamaService for AI operations
6. **Type Hints**: Add type hints for all parameters and returns
7. **Documentation**: Include docstrings for OpenAPI docs

## Template Structure

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Annotated
from datetime import datetime

router = APIRouter(prefix="/api/[resource]", tags=["[resource]"])

# Request Model
class CreateRequest(BaseModel):
    """Request schema for creating resource."""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    options: dict = Field(default_factory=dict)

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Example",
                "description": "Example description",
                "options": {}
            }
        }
    }

# Response Model
class CreateResponse(BaseModel):
    """Response schema for created resource."""
    id: str
    name: str
    created_at: datetime
    success: bool = True

# Dependency
async def get_service() -> ServiceClass:
    """Dependency injection for service."""
    return ServiceClass()

# Route Handler
@router.post("/", response_model=CreateResponse, status_code=201)
async def create_resource(
    request: CreateRequest,
    service: Annotated[ServiceClass, Depends(get_service)]
) -> CreateResponse:
    """
    Create a new resource.

    Args:
        request: Resource creation parameters
        service: Injected service instance

    Returns:
        CreateResponse: Created resource details

    Raises:
        HTTPException: 400 if validation fails, 500 for server errors
    """
    try:
        # Validation (automatic via Pydantic)

        # Business logic
        result = await service.create(request.name, request.description)

        return CreateResponse(
            id=result.id,
            name=result.name,
            created_at=datetime.utcnow()
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create resource: {str(e)}"
        )

# Additional handlers (GET, PUT, DELETE)
@router.get("/{resource_id}", response_model=CreateResponse)
async def get_resource(resource_id: str) -> CreateResponse:
    """Get resource by ID."""
    # Implementation
    pass
```

## CrewAI Integration Example

```python
from crewai import Agent, Task, Crew
from langchain_ollama import ChatOllama
from services.ollama_service import OllamaService

@router.post("/generate")
async def generate_content(
    request: GenerationRequest,
    ollama: Annotated[OllamaService, Depends(get_ollama_service)]
) -> GenerationResponse:
    """Generate content using CrewAI agents."""

    # Initialize LLM
    llm = ChatOllama(
        model="llama3.1:8b",
        base_url=ollama.base_url
    )

    # Create agents
    researcher = Agent(
        role="Researcher",
        goal="Research the topic",
        llm=llm
    )

    writer = Agent(
        role="Writer",
        goal="Write the content",
        llm=llm
    )

    # Define tasks
    research_task = Task(
        description=f"Research {request.topic}",
        agent=researcher
    )

    writing_task = Task(
        description=f"Write {request.word_count} words",
        agent=writer,
        context=[research_task]
    )

    # Execute crew
    crew = Crew(agents=[researcher, writer], tasks=[research_task, writing_task])
    result = crew.kickoff(inputs={"topic": request.topic})

    return GenerationResponse(
        content=result,
        word_count=len(result.split())
    )
```

## What to Include

- Import statements for FastAPI, Pydantic, typing
- Pydantic request/response models with validation
- APIRouter with prefix and tags
- Async route handlers with type hints
- Proper error handling with HTTPException
- Docstrings for OpenAPI documentation
- Dependency injection where needed
- Ollama/CrewAI integration for AI endpoints
