# eCommerce

A modular-monolith eCommerce project used to learn Node.js and Next.js from a .NET background. The repository is a monorepo: one Git history, with separate folders for the storefront, the API, and code they will share.

## Planned stack

- JavaScript and TypeScript
- React and Next.js for the storefront (`apps/web`)
- Node.js and Express for the API (`apps/api`)
- PostgreSQL with Prisma ORM
- Shared types or validation schemas in `packages/shared`, where that sharing is actually useful
- OpenAI API, in a later phase, called only from the API

## Layout

| Path                | Role                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `apps/web`          | Next.js storefront. Has a workspace manifest and TypeScript config. The application is not created yet. |
| `apps/api`          | Node.js and Express API. Has a workspace manifest and TypeScript config. The server is not created yet. |
| `packages/shared`   | Shared types or validation schemas. Has a workspace manifest. No shared modules yet.                    |
| `docs`              | Project documentation that does not belong in application code.                                         |
| `.github/workflows` | GitHub Actions workflows, when CI is added.                                                             |

Empty directories contain a `.gitkeep` file. Git tracks files, not folders, so that file is only there to keep the directory in the repository until real files replace it.

## Architecture

The repository is a modular monolith with two applications. Next.js in `apps/web` owns the UI, routing, and rendering. Express in `apps/api` owns business rules and PostgreSQL access through Prisma. The web app calls the API over HTTP and does not open the database.

Inside Express the path is route, middleware, controller, service, repository, Prisma, then PostgreSQL. Catalog, cart, inventory, orders, users, and a later AI integration are modules in that one API process.

The decisions, module boundaries, and request flows are in [docs/architecture.md](docs/architecture.md).

## Development

Node.js 22.16 or newer and npm 9.2 or newer. npm has supported workspaces since npm 7, so the installed npm 9.2.0 can install this repo. A global npm upgrade is not required.

Install the tooling dependencies from the repository root:

```bash
npm install
```

Checks that run today:

```bash
npm run lint
npm run format:check
npm run typecheck:config
```

`npm run format` writes Prettier formatting. `typecheck:config` loads the root TypeScript config and each workspace config. It fails if a compiler option is invalid. It does not typecheck application source, because there is none yet. Each workspace config sets `"files": []` so an empty folder is valid, and `"include"` so future `src` or `app` files join the program automatically.

`dev`, `build`, and a source `typecheck` script are intentionally absent. A script that exited successfully with no application would hide the fact that nothing was checked. Those scripts arrive with the Next.js app and the Express server.

### Environment files

The root package does not run a server, so there is no root `.env.example`.

| File, added with that app | Values                                             |
| ------------------------- | -------------------------------------------------- |
| `apps/web/.env.example`   | `API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`         |
| `apps/api/.env.example`   | `PORT`, `DATABASE_URL`, and later `OPENAI_API_KEY` |

`.gitignore` ignores real `.env` files and keeps `*.env.example` trackable. Do not put credentials in tracked files.

### Lint and format

ESLint and Prettier are configured at the root. Prettier owns formatting. `eslint-config-prettier` turns off ESLint rules that would disagree with Prettier.

Next.js rules are not installed yet. `eslint-config-next` depends on Next.js and React. When `apps/web` is scaffolded, install that package with the web app and add a root ESLint block scoped to `apps/web/**/*.{js,jsx,ts,tsx}` using `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Keep the Prettier block after that block.

## Current stage

Step 01 created the folders, `.gitignore`, this README, and the local Git repository.

Step 02 records the architecture in `docs/architecture.md`.

Step 03 adds npm workspaces, TypeScript, ESLint, and Prettier. Application code is still not started.

Not started yet:

- No Next.js application and no Express server
- No React, Express, Prisma, or other application dependencies
- No database, Prisma schema, API routes, authentication, or UI
- No commits and no GitHub remote

## Local Git

This folder is a local Git repository. Nothing is staged or committed, and nothing is pushed.
