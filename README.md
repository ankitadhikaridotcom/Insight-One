# Insight

Insight is a Next.js App Router workspace built with TypeScript and Tailwind CSS 4. Supabase SSR and browser clients are ready to use.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Supabase configuration

The local `.env.local` contains this project's Supabase URL and publishable key. `.env.local` is excluded from Git. To configure another environment, copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Use the project's publishable key (or legacy anon key), never a `service_role` or secret key in a `NEXT_PUBLIC_` variable. Restart the dev server after changing environment values.

Use `createClient` from `@/utils/supabase/client` in browser code, or from `@/utils/supabase/server` in Server Components and Route Handlers. The root `proxy.ts` refreshes Supabase auth cookies when configured. Authentication screens and database-specific queries are not included yet.

## Checks

```bash
npm run lint
npm run build
```