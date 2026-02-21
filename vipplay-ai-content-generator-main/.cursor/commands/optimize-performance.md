# Optimize Performance

Analyze and optimize code, database queries, and API endpoints for better performance.

## Requirements

1. **Measure first** - Profile before optimizing
2. **Set targets** - Define performance goals
3. **Optimize systematically** - Address bottlenecks
4. **Verify improvements** - Measure after changes
5. **Document changes** - Explain optimizations

## Performance Checklist

### Frontend (Next.js/React)
- [ ] Minimize bundle size
- [ ] Use code splitting
- [ ] Lazy load components
- [ ] Optimize images (Next.js Image)
- [ ] Implement caching
- [ ] Use React.memo for expensive components
- [ ] Reduce re-renders
- [ ] Use virtual scrolling for long lists
- [ ] Prefetch critical data
- [ ] Minimize API calls

### Backend (Next.js API Routes)
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Use MongoDB aggregation pipelines
- [ ] Implement caching (Redis)
- [ ] Use connection pooling
- [ ] Batch operations
- [ ] Add pagination
- [ ] Use server-side rendering strategically
- [ ] Compress responses
- [ ] Rate limit expensive operations

### AI Service (FastAPI)
- [ ] Use async/await everywhere
- [ ] Implement concurrent operations
- [ ] Cache model responses
- [ ] Use background tasks for long operations
- [ ] Optimize Ollama model selection
- [ ] Batch CrewAI tasks
- [ ] Use connection pooling (httpx)
- [ ] Stream responses for large content
- [ ] Implement timeout handling
- [ ] Add circuit breakers for Ollama

### Database (MongoDB)
- [ ] Add indexes on frequently queried fields
- [ ] Use compound indexes
- [ ] Optimize aggregation pipelines
- [ ] Use projection to limit fields
- [ ] Batch write operations
- [ ] Use covered queries
- [ ] Analyze slow queries
- [ ] Remove unused indexes
- [ ] Use appropriate read concerns
- [ ] Implement sharding (if needed)

## Common Optimizations

### 1. Database Query Optimization
```typescript
// Before - N+1 query problem
const users = await db.collection('users').find().toArray();
for (const user of users) {
  const articles = await db.collection('articles')
    .find({ userId: user._id }).toArray();
}

// After - Single aggregation
const users = await db.collection('users').aggregate([
  {
    $lookup: {
      from: 'articles',
      localField: '_id',
      foreignField: 'userId',
      as: 'articles'
    }
  }
]).toArray();
```

### 2. React Component Optimization
```tsx
// Before - Re-renders on every parent update
function UserCard({ user }) {
  return <div>{user.name}</div>;
}

// After - Memoized
const UserCard = React.memo(({ user }) => {
  return <div>{user.name}</div>;
}, (prev, next) => prev.user.id === next.user.id);
```

### 3. API Response Caching
```typescript
// Before - No caching
export const GET = withAuth(async (req, context) => {
  const data = await fetchExpensiveData();
  return NextResponse.json({ success: true, data });
});

// After - With caching
import { unstable_cache } from 'next/cache';

const getCachedData = unstable_cache(
  async () => fetchExpensiveData(),
  ['expensive-data'],
  { revalidate: 3600 } // 1 hour
);

export const GET = withAuth(async (req, context) => {
  const data = await getCachedData();
  return NextResponse.json({ success: true, data });
});
```

### 4. Async Optimization (FastAPI)
```python
# Before - Sequential
async def process_content(topics: List[str]):
    results = []
    for topic in topics:
        result = await generate_content(topic)
        results.append(result)
    return results

# After - Concurrent
async def process_content(topics: List[str]):
    tasks = [generate_content(topic) for topic in topics]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

## Performance Metrics

### Response Time Targets
- **API endpoints**: < 200ms
- **Database queries**: < 50ms
- **Page load (First Contentful Paint)**: < 1.5s
- **Time to Interactive**: < 3.5s
- **AI generation**: < 30s

### Optimization Goals
- Reduce API response time by 50%
- Improve page load speed by 30%
- Decrease database query time by 70%
- Lower memory usage by 40%
- Increase throughput by 2x

## Usage Example

```
/optimize-performance
Optimize the content generation flow:
- API route: app/api/content/generate/route.ts
- FastAPI endpoint: api-service/routers/generation.py
- Target: < 10s generation time
```

## Tools for Analysis

### Frontend
- Chrome DevTools Performance tab
- Lighthouse
- Next.js Speed Insights
- React DevTools Profiler

### Backend
- `console.time()` / `console.timeEnd()`
- MongoDB explain plans
- FastAPI profiling
- Ollama performance metrics

### Database
- MongoDB Compass
- `explain()` for queries
- Slow query logs
- Index analysis

## What to Include

1. **Baseline metrics**: Current performance
2. **Bottlenecks**: Identified slow areas
3. **Optimizations**: Changes made
4. **Results**: Performance improvements
5. **Trade-offs**: Any compromises made

