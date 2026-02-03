# AGENTS.md

## Overview

This is a Next.js 14 application for managing furniture quotations, built with TypeScript, Tailwind CSS, Prisma, and PostgreSQL. It uses the App Router, server and client components, and follows modern React patterns.

## Commands

### Build Commands
- `npm run build` or `yarn build`: Builds the application for production using Next.js build
- `npm run start` or `yarn start`: Starts the production server on port 3000

### Development Commands
- `npm run dev` or `yarn dev`: Starts the development server with hot reloading on port 3000

### Lint Commands
- `npm run lint` or `yarn lint`: Runs ESLint with Next.js configuration to check code quality and style

### Test Commands
This project does not currently have test scripts configured. When tests are added:
- `npm test` or `yarn test`: Run all tests (if configured)
- `npm test -- --testNamePattern="test name"`: Run a single test by name (Jest/Vitest pattern)
- `npm test -- --testPathPattern="component.spec.ts"`: Run tests for specific files

### Database Commands
- `npm run db:seed` or `yarn db:seed`: Seeds the database with initial data using tsx
- `npx prisma migrate deploy`: Applies pending migrations to production database
- `npx prisma generate`: Generates Prisma client from schema
- `npx prisma db push`: Pushes schema changes to database (development)
- `npx prisma studio`: Opens Prisma Studio for database management

### Docker Commands
- `docker compose up -d`: Start all services (app, postgres, nginx)
- `docker compose build app`: Rebuild the app container
- `docker compose logs app`: View app logs
- `docker compose exec app sh`: Access app container shell

## Code Style Guidelines

### General Principles
- **TypeScript First**: All new code must be written in TypeScript with strict type checking
- **Modern React**: Use functional components, hooks, and modern patterns
- **Accessibility**: Follow WCAG guidelines and use semantic HTML
- **Performance**: Optimize for Core Web Vitals, use lazy loading, memoization when appropriate
- **Security**: Validate all inputs, use HTTPS, avoid client-side secrets

### File Structure
- `app/`: Next.js App Router pages and API routes
- `components/`: Reusable React components
- `lib/`: Utility functions, configurations, database client
- `hooks/`: Custom React hooks
- `prisma/`: Database schema and migrations
- `public/`: Static assets
- `scripts/`: Database seeding and utility scripts

### Naming Conventions
- **Files**: kebab-case for pages/routes (e.g., `sign-in.tsx`), camelCase for components (e.g., `QuoteCard.tsx`)
- **Variables/Functions**: camelCase (e.g., `handleSubmit`, `isLoading`)
- **Components**: PascalCase (e.g., `SignInForm`, `DashboardPage`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `QuoteData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_TIMEOUT`)
- **Directories**: camelCase (e.g., `userSettings`, `apiRoutes`)

### Imports
Group imports with blank lines between categories:
```typescript
// React imports
import { useState, useEffect } from 'react'

// Next.js imports
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// External libraries
import { toast } from 'sonner'
import { PrismaClient } from '@prisma/client'

// Internal imports (use @/ alias)
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
```

### TypeScript Types
- Use explicit types for function parameters and return values
- Prefer `interface` for object shapes, `type` for unions/aliases
- Use utility types like `Partial<T>`, `Pick<T, K>` appropriately
- Avoid `any`; use `unknown` or specific types
- Use `Record<string, T>` for dynamic objects
- Define types near their usage or in separate `.types.ts` files

```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
}

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

function fetchUser(id: string): Promise<User> {
  // implementation
}
```

### Components
- Use functional components with arrow functions
- Define props interfaces explicitly
- Destructure props in function parameters
- Use early returns for conditional rendering
- Prefer controlled components for forms
- Use `forwardRef` for components that need refs

```typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

const Button = ({ children, variant = 'primary', onClick }: ButtonProps) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### Styling
- Use Tailwind CSS for utility classes
- Follow component-based styling with Shadcn/UI
- Use CSS variables for theming
- Avoid inline styles except for dynamic values
- Use `cn()` utility for conditional classes

```typescript
import { cn } from '@/lib/utils'

const Button = ({ className, variant, ...props }) => {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md font-medium",
        variant === 'primary' && "bg-blue-500 text-white",
        variant === 'secondary' && "bg-gray-200 text-gray-800",
        className
      )}
      {...props}
    />
  )
}
```

### Error Handling
- Use try-catch for async operations
- Log errors with `console.error` for debugging
- Show user-friendly messages with toast notifications
- Return default values or null on errors
- Use error boundaries for React components

```typescript
try {
  const result = await apiCall()
  return result
} catch (error) {
  console.error('API call failed:', error)
  toast.error('Failed to load data')
  return null
}
```

### API Routes
- Use consistent response format: `{ success: boolean, data?: T, error?: string }`
- Validate inputs with Zod schemas
- Use Prisma transactions for multiple database operations
- Handle errors gracefully and return appropriate HTTP status codes

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = createUserSchema.parse(body)

    const user = await prisma.user.create({
      data: { email, name }
    })

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
```

### Database
- Use Prisma ORM with type-safe queries
- Follow Prisma naming conventions (snake_case in schema, camelCase in code)
- Use transactions for related operations
- Implement proper indexes for performance
- Use raw SQL only when necessary

```typescript
// Good: Type-safe Prisma query
const user = await prisma.user.findUnique({
  where: { email },
  include: { quotes: true }
})

// Good: Transaction for related operations
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData })
  await tx.auditLog.create({
    data: { action: 'USER_CREATED', userId: user.id }
  })
})
```

### State Management
- Use Zustand for global state (already configured)
- Use React Query (TanStack Query) for server state
- Use local component state for UI state
- Avoid prop drilling with context when possible

### Forms
- Use React Hook Form for complex forms
- Validate with Zod schemas
- Show validation errors inline
- Use controlled components

### Performance
- Use `React.memo` for expensive components
- Implement lazy loading for routes and components
- Optimize images with Next.js Image component
- Use pagination for large datasets
- Implement proper loading states

### Security
- Validate all user inputs on server and client
- Use NextAuth.js for authentication
- Implement role-based access control
- Avoid storing sensitive data in localStorage
- Use HTTPS in production
- Sanitize user inputs to prevent XSS

### Testing (Future)
- Write unit tests for utility functions
- Write integration tests for API routes
- Write component tests with React Testing Library
- Aim for >80% code coverage
- Use descriptive test names

### Git Workflow
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Write clear commit messages
- Create feature branches from main
- Use pull requests for code review
- Squash commits before merging

### Documentation
- Document complex business logic with comments
- Use JSDoc for public APIs
- Keep README updated
- Document environment variables
- Use TypeScript types as documentation

This guide ensures consistent, maintainable, and scalable code across the project.