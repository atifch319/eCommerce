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
| `apps/api`          | Express API. Serves `GET /api/health`. Database and business modules come later.                        |
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

Repo-wide checks:

```bash
npm run lint
npm run format:check
npm run typecheck:config
```

`npm run format` writes Prettier formatting. `typecheck:config` checks that the TypeScript config files parse. It does not replace `npm run typecheck --workspace=@ecommerce/api`, which type-checks the API source.

The web app still has no `dev` or `build` script. Those arrive with the Next.js app.

### Environment files

The root package does not run a server, so there is no root `.env.example`.

| File                    | Values                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| `apps/api/.env.example` | `PORT`, `NODE_ENV`, `FRONTEND_ORIGIN`                               |
| `apps/web/.env.example` | `API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, when the web app exists |

`.gitignore` ignores real `.env` files and keeps `*.env.example` trackable. Do not put credentials in tracked files.

## Backend

The API listens on port **4000** by default. That leaves port 3000 free for Next.js, which matches [docs/architecture.md](docs/architecture.md). Copy the example file if you want to change the port or environment name. If `PORT` is unset, the server still starts on 4000.

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

Start the API in development. This restarts the process when `apps/api/src` changes:

```powershell
npm run dev --workspace=@ecommerce/api
```

Health check:

[http://localhost:4000/api/health](http://localhost:4000/api/health)

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

The health body is unchanged: `success`, `message`, and `timestamp`.

Unknown routes return 404 with `success: false` and `error.code` `ROUTE_NOT_FOUND`. Malformed JSON returns 400. A JSON body larger than 1 MB returns 413.

`POST /api/examples/validation` is a learning route, not the product catalog. A valid body is `{ "name": "Laptop", "price": 1200, "quantity": 5 }`. An optional `currency` query must be three uppercase letters, such as `?currency=USD`. `POST /api/examples/validation/:itemCode` checks the same body plus a route parameter.

CORS allows `FRONTEND_ORIGIN` (default `http://localhost:3000`) and does not use `*`. Credentialed cookies are off until authentication chooses a cookie or a bearer token. `Authorization` is already an allowed request header.

Development logs use Morgan's `dev` format. Production uses `combined`. Neither format records the body or the `Authorization` header.

Build the production JavaScript, then run it:

```powershell
npm run build --workspace=@ecommerce/api
npm run start --workspace=@ecommerce/api
```

API checks:

```powershell
npm run typecheck --workspace=@ecommerce/api
npm run lint --workspace=@ecommerce/api
```

This is a local server only. Nothing here deploys the API.

### Lint and format

ESLint and Prettier are configured at the root. Prettier owns formatting. `eslint-config-prettier` turns off ESLint rules that would disagree with Prettier.

Next.js rules are not installed yet. `eslint-config-next` depends on Next.js and React. When `apps/web` is scaffolded, install that package with the web app and add a root ESLint block scoped to `apps/web/**/*.{js,jsx,ts,tsx}` using `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Keep the Prettier block after that block.

## Current stage

Step 01 created the folders, `.gitignore`, this README, and the local Git repository.

Step 02 records the architecture in `docs/architecture.md`.

Step 03 adds npm workspaces, TypeScript, ESLint, and Prettier.

Step 04 adds the Express API and `GET /api/health`.

Step 05 adds the request pipeline: CORS, request logs, JSON limits, Zod validation, and one error format. The storefront, database, and authentication are still not started.

Not started yet:

- No Next.js application
- No Prisma schema, product API, authentication, or UI
- No commits and no GitHub remote

## Local Git

This folder is a local Git repository. Nothing is staged or committed, and nothing is pushed.
