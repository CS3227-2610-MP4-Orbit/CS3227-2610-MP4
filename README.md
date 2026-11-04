# CS3227 MP4: Python bug workflow

The [development-agent workflow](workflow/README.md) and [approved feature spec](workflow/specs/001-bug-lifecycle/spec.md) are ready. The product app has not been implemented. The previous product idea and its database migration have been removed from the starter.

## Local starter

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Configure local Supabase values in `.env.local` if using authentication. The next implementation task is the Reporter flow in [tasks.md](workflow/specs/001-bug-lifecycle/tasks.md).
