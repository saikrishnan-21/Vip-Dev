# Langfuse Integration Guide

This document explains how to set up and use Langfuse for LLM observability in the VIPContentAI FastAPI service.

## What is Langfuse?

Langfuse is an open-source LLM observability platform that helps you:
- **Track** all LLM calls and their performance
- **Debug** issues with detailed traces and logs
- **Monitor** token usage and costs
- **Improve** prompts and model selection based on data

## Features Integrated

The Langfuse integration tracks:
1. **Ollama Service Calls**: Direct Ollama API calls for text generation
2. **Content Generation Endpoints**: Full traces for topic, keywords, trends, and spin generation
3. **CrewAI Agent Workflows**: Multi-agent content generation traces
4. **Token Usage**: Prompt, completion, and total token counts
5. **Metadata**: Model names, parameters, and generation settings

## Setup

### 1. Install Dependencies

Langfuse is already included in `requirements.txt`. Install it with:

```bash
cd api-service
pip install -r requirements.txt
```

### 2. Get Langfuse Credentials

You have two options:

#### Option A: Langfuse Cloud (Recommended)

1. Sign up at [https://cloud.langfuse.com](https://cloud.langfuse.com)
2. Create a new project
3. Go to Settings → API Keys
4. Copy your **Public Key** and **Secret Key**

#### Option B: Self-Hosted Langfuse

1. Deploy Langfuse on your own infrastructure
2. Set `LANGFUSE_HOST` to your Langfuse instance URL
3. Get API keys from your self-hosted instance

### 3. Configure Environment Variables

Add these variables to your `.env` file in the `api-service/` directory:

```bash
# Langfuse Configuration
LANGFUSE_ENABLED=true
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxxxxxxxxxx
LANGFUSE_SECRET_KEY=sk-lf-xxxxxxxxxxxxx
LANGFUSE_HOST=https://cloud.langfuse.com  # Optional: defaults to cloud.langfuse.com
```

**Note**: Set `LANGFUSE_ENABLED=false` to disable Langfuse without removing the code.

### 4. Restart the Service

After adding the environment variables, restart your FastAPI service:

```bash
# If using uvicorn directly
uvicorn main:app --reload

# If using PM2
pm2 restart api-service
```

## Usage

### Automatic Tracing

Once configured, Langfuse automatically traces:

1. **Ollama Generation Calls** (`services/ollama_service.py`)
   - Tracks model, messages, tokens, and response
   - Creates spans for each LLM call

2. **Content Generation Endpoints** (`routers/generation.py`)
   - `/api/generation/topic` - Topic-based generation
   - `/api/generation/keywords` - Keyword-based generation
   - `/api/generation/trends` - Trends-based generation
   - `/api/generation/spin` - Article spinning

3. **Trace Metadata**
   - Generation parameters (word count, tone, SEO settings)
   - Model information
   - User context (if provided)
   - Performance metrics

### Manual Tracing

You can also create custom traces in your code:

```python
from services.langfuse_service import trace_generation, trace_llm_call, get_langfuse_client

# Trace a complete generation workflow
with trace_generation(
    trace_name="custom_generation",
    user_id="user123",
    metadata={"custom_field": "value"},
    tags=["production", "v2"]
) as trace:
    # Your generation code here
    result = await generate_content()
    
    # Add a span for a specific LLM call
    trace_llm_call(
        trace=trace,
        span_name="custom_llm_call",
        model="ollama/llama3.1:8b",
        messages=[{"role": "user", "content": "Hello"}],
        response="Generated response",
        tokens_used={"prompt": 10, "completion": 20, "total": 30}
    )
```

## Viewing Traces

### Langfuse Dashboard

1. Go to [https://cloud.langfuse.com](https://cloud.langfuse.com) (or your self-hosted URL)
2. Navigate to your project
3. View traces in the **Traces** section
4. Filter by:
   - Trace name
   - User ID
   - Date range
   - Metadata fields
   - Tags

### Trace Details

Each trace shows:
- **Timeline**: Visual representation of spans and their duration
- **Input/Output**: Messages sent to and received from LLMs
- **Token Usage**: Breakdown of prompt, completion, and total tokens
- **Metadata**: Custom fields and generation parameters
- **Errors**: Any errors that occurred during generation

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LANGFUSE_ENABLED` | No | `false` | Enable/disable Langfuse tracing |
| `LANGFUSE_PUBLIC_KEY` | Yes* | - | Langfuse public API key |
| `LANGFUSE_SECRET_KEY` | Yes* | - | Langfuse secret API key |
| `LANGFUSE_HOST` | No | `https://cloud.langfuse.com` | Langfuse server URL |

*Required only if `LANGFUSE_ENABLED=true`

### Disabling Langfuse

To disable Langfuse without removing code:

```bash
LANGFUSE_ENABLED=false
```

Or simply don't set the API keys - the service will gracefully skip tracing.

## Troubleshooting

### Traces Not Appearing

1. **Check Environment Variables**
   ```bash
   # Verify variables are set
   echo $LANGFUSE_ENABLED
   echo $LANGFUSE_PUBLIC_KEY
   ```

2. **Check Logs**
   ```bash
   # Look for Langfuse initialization messages
   tail -f logs/app.log | grep -i langfuse
   ```

3. **Verify API Keys**
   - Ensure keys are correct and not expired
   - Check that keys have write permissions

4. **Network Connectivity**
   - Verify the service can reach `LANGFUSE_HOST`
   - Check firewall rules if self-hosting

### Common Errors

**"Langfuse keys not configured"**
- Set `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` in `.env`

**"Failed to initialize Langfuse client"**
- Check network connectivity to Langfuse host
- Verify API keys are correct
- Check Langfuse service status

**"Langfuse package not installed"**
- Run `pip install -r requirements.txt`

## Best Practices

1. **Use Descriptive Trace Names**
   - Use specific names like `topic_generation` instead of `generate`
   - Include version or environment in trace names if needed

2. **Add Relevant Metadata**
   - Include generation parameters (word count, tone, etc.)
   - Add user context when available
   - Tag traces with environment (production, staging)

3. **Monitor Token Usage**
   - Track token consumption to optimize costs
   - Identify models with high token usage
   - Set up alerts for unusual patterns

4. **Review Traces Regularly**
   - Check for errors or failures
   - Identify slow generations
   - Optimize prompts based on successful traces

## Integration Points

### Files Modified

- `api-service/services/langfuse_service.py` - Langfuse service and utilities
- `api-service/services/ollama_service.py` - Ollama tracing integration
- `api-service/routers/generation.py` - Generation endpoint tracing
- `api-service/requirements.txt` - Langfuse package dependency

### Service Architecture

```
FastAPI Endpoint
    ↓
trace_generation() (context manager)
    ↓
CrewAI Crew Execution
    ↓
LLM Calls (via CrewAI/LiteLLM)
    ↓
Ollama Service (with tracing)
    ↓
Langfuse Dashboard
```

## Additional Resources

- [Langfuse Documentation](https://langfuse.com/docs)
- [Langfuse Python SDK](https://langfuse.com/docs/sdk/python)
- [Langfuse Cloud](https://cloud.langfuse.com)
- [Self-Hosting Langfuse](https://langfuse.com/docs/deployment/self-host)

## Support

For issues with Langfuse integration:
1. Check the troubleshooting section above
2. Review Langfuse logs in `logs/app.log`
3. Check Langfuse dashboard for error details
4. Consult [Langfuse Documentation](https://langfuse.com/docs)

