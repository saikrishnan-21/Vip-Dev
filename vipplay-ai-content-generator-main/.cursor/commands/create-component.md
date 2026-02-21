# Create React Component

Create a new React component with proper TypeScript types, client/server directive, and Tailwind styling.

## Requirements

1. **Location**:
   - UI components: `components/ui/[name].tsx`
   - Custom components: `components/[name].tsx`
   - Page components: `app/[route]/page.tsx`

2. **Client vs Server**:
   - Add `"use client"` if using hooks, events, or browser APIs
   - Omit directive for server components (data fetching)

3. **TypeScript**: Define prop interfaces with proper types

4. **Styling**: Use Tailwind CSS utility classes

5. **Patterns**:
   - Functional components only
   - Use hooks for state management
   - Destructure props
   - Export default for pages, named for reusable components

## Template

```typescript
"use client"  // Only if needed

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ComponentNameProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

export function ComponentName({
  title,
  onAction,
  className
}: ComponentNameProps) {
  const [state, setState] = useState<string>('');

  const handleClick = () => {
    // Logic
    onAction?.();
  };

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={handleClick}>Action</Button>
    </div>
  );
}
```

## Server Component Example

```typescript
import { db } from '@/lib/mongodb';

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}

export default async function Page({ params, searchParams }: PageProps) {
  const data = await db.collection('items').find().toArray();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Title</h1>
      {/* Render data */}
    </div>
  );
}
```

## What to Include

- Proper imports (React, UI components, types)
- TypeScript interface for props
- Client directive if using hooks/events
- Tailwind CSS for styling
- Event handlers with proper types
- Accessibility attributes (aria-labels, etc.)
- Comments for complex logic
