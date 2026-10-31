# eCommerce architecture

This document records the architecture for the eCommerce monorepo. It is the source of truth for how the system is shaped. It does not implement that system.

**Decided now:** boundaries, responsibilities, request paths, and rules the later code must follow.

**Planned for later steps:** application code, the Next.js and Express dependencies, the database schema, authentication, and the UI. Workspace manifests and development tooling are not application code.

## 1. Project overview

eCommerce is a learning project and a real storefront shape: customers browse products, manage a cart, and check out. Staff later use an admin UI to manage the catalog.

Two applications share one Git repository:

| Application | Path       | Owns                                                        |
| ----------- | ---------- | ----------------------------------------------------------- |
| Web         | `apps/web` | Screens, routing, rendering, and presentation               |
| API         | `apps/api` | Business rules, validation, authorization, and the database |

`packages/shared` holds types or validation schemas only when both applications need the same contract. `docs` holds architecture and technical notes, including this file.

A later phase adds an OpenAI integration behind the API. The model does not become a second place where prices, stock, or orders are decided.

## 2. Architecture style and rationale

The style is a **modular monolith in a monorepo**, with a separate web process and API process.

A modular monolith means one backend deployable, divided into modules with explicit responsibilities. Products, inventory, and orders live in one Express process and one PostgreSQL database. A checkout can update an order and the stock count in a single database transaction.

A monorepo means `apps/web`, `apps/api`, and `packages/shared` share one Git history. That makes contract changes visible in one pull request.

This split matches a common .NET layout: an ASP.NET Core Web API plus a separate UI. Next.js replaces the UI host. Express replaces ASP.NET Core. Prisma replaces EF Core. PostgreSQL replaces SQL Server. The layering habit stays the same.

Out of scope for this stage, and not part of the design:

- Microservices and separate databases per module
- Message brokers
- CQRS and event sourcing
- A generic repository framework

Those tools solve operational problems this project does not have. Module folders keep a later split possible if a real operational need appears.

## 3. Technology choices

| Technology          | Role                                                                                                                                                   | When                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| TypeScript          | Typed JavaScript for the web app, the API, and shared contracts                                                                                        | When each app is created                                                                                               |
| React               | UI components                                                                                                                                          | With the Next.js app                                                                                                   |
| Next.js App Router  | Web routing, layouts, and rendering                                                                                                                    | With the Next.js app                                                                                                   |
| Node.js and Express | HTTP API and business rules                                                                                                                            | With the API                                                                                                           |
| Zod                 | Runtime validation of request input. TypeScript types disappear after compilation; Zod checks the actual JSON. This is the FluentValidation equivalent | With the first API module. Shared schemas move to `packages/shared` only when the web app must validate the same shape |
| Prisma ORM          | Typed database access and migrations                                                                                                                   | With the first persistence step                                                                                        |
| PostgreSQL          | System of record for catalog, users, carts, inventory, and orders                                                                                      | With Prisma                                                                                                            |
| Git and GitHub      | Local history now. GitHub remote and Actions later                                                                                                     | Remote and CI are later                                                                                                |
| OpenAI API          | Recommendations or catalog assistance behind the AI module                                                                                             | Later phase. The API key stays on the Express process                                                                  |

Express is the authoritative backend. Next.js calls it with HTTP REST. Next.js does not open PostgreSQL and does not embed business rules for price, stock, or orders.

## 4. Proposed directory structure

### What exists today

```
eCommerce/
  apps/
    web/                     package.json and tsconfig.json; no Next.js app yet
    api/                     Express health-check server; no database or business modules yet
  packages/
    shared/                  package.json and tsconfig.json; no shared modules yet
  docs/
    architecture.md
  .github/
    workflows/               .gitkeep only
  .gitignore
  README.md
  package.json               npm workspaces and tooling scripts
  tsconfig.json              root TypeScript entry; shared options live in tsconfig.base.json
```

### Target shape for later steps

Names below are the planned layout. Creating these files is a later step.

```
eCommerce/
  apps/
    web/
      app/
        (store)/
          page.tsx                     product listing, route /
          products/[slug]/page.tsx     product detail
          cart/page.tsx
          checkout/page.tsx
          layout.tsx
        (admin)/
          layout.tsx                   admin shell
          products/page.tsx
        layout.tsx                     root layout
        loading.tsx
        error.tsx
        not-found.tsx
      components/                      presentation components
      lib/api/                         HTTP client for Express
    api/
      src/
        server.ts                      process entry: listen on a port
        app.ts                         Express app: middleware and routes
        middleware/                    cross-cutting HTTP middleware
        modules/
          products/
          categories/
          inventory/
          users/
          cart/
          orders/
          ai/
        lib/                           Prisma client lifecycle, shared API errors
      prisma/
        schema.prisma                  API-owned schema
  packages/
    shared/                            DTOs or Zod schemas used by both apps
```

Each API module uses the same internal shape:

```
modules/<name>/
  <name>.routes.ts
  <name>.controller.ts
  <name>.service.ts
  <name>.repository.ts
```

A file appears when that module is implemented. Empty modules are not created in advance.

`packages/shared` stays empty until a type or schema is imported by both apps. Duplicating a one-off response type inside the API is acceptable. Sharing Express code, React components, or the Prisma client is not.

## 5. Frontend responsibilities

`apps/web` is a Next.js App Router application. It owns what the customer and the admin see. It asks Express for data and renders the result.

### App Router, pages, and layouts

The `app` directory defines URLs. A `page.tsx` file is a route. A `layout.tsx` file wraps the routes beneath it and keeps shared chrome, such as the header, mounted across navigations.

Planned customer routes:

| URL                | Screen          |
| ------------------ | --------------- |
| `/`                | Product listing |
| `/products/[slug]` | Product detail  |
| `/cart`            | Cart            |
| `/checkout`        | Checkout        |

`(store)` and `(admin)` are route groups. The parentheses keep store and admin layouts separate. They do not appear in the URL.

`loading.tsx`, `error.tsx`, and `not-found.tsx` are the App Router hooks for in-progress navigation, failed rendering, and unknown URLs.

### Server Components and Client Components

Components are Server Components unless a file starts with `"use client"`.

Server Components render on the Next.js server. They can `fetch` Express while the page is being built and send HTML to the browser. Product listing and product detail fit this model: the important content is on the page before the browser runs JavaScript.

Client Components run in the browser and handle interaction: quantity controls, checkout field updates, and other UI that reacts to input without a full document reload.

The client boundary stays as low in the tree as possible. A product page can be a Server Component that renders a small Client Component for "Add to cart". The whole page does not need to be client-rendered to make one button interactive.

### Cart and checkout UI

The cart screen shows lines, quantities, and the subtotal returned by the API. The checkout screen collects the customer details required to place an order.

The UI may display a price. The UI does not decide the price. Checkout submits identifiers and quantities. Express reloads the current price and stock before it writes an order.

### Admin UI boundary

Admin screens live under the `(admin)` group. They call admin endpoints on Express.

Hiding a link in the UI is presentation. Allowing or rejecting the operation is an Express authorization decision, implemented in a later step. Until that exists, admin screens are not built.

### API client

One module, planned as `apps/web/lib/api`, is responsible for:

- The Express base URL
- Timeouts
- Parsing the JSON error body
- Turning network failures and non-2xx responses into a result the page can render

Pages call that client. They do not scatter raw URLs and `fetch` options through components.

### Loading, error, and empty states

| State   | What the customer sees                                      | Where it is handled                                                                  |
| ------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Loading | A stable placeholder while the product request is in flight | `loading.tsx` for route transitions. Button-level pending state for cart actions     |
| Error   | A short message and a way to retry. No stack traces         | `error.tsx` for render failures. Inline message for a failed cart or checkout action |
| Empty   | An explicit empty catalog, empty cart, or empty admin list  | The page, when Express returns an empty collection                                   |

An empty list is a successful response. It is a different case from a timeout or a 500.

### How the UI talks to Express

The browser and the Next.js server both use HTTP. They target Express routes such as `GET /products/:slug`. They never import the Prisma client.

**Server-side requests** are the default for the first view of a page. The Next.js server calls Express, then renders HTML. Use this for product listing, product detail, and other reads needed to show the page. The browser does not have to make a second request before the customer sees the product. This path also keeps server-only configuration on the Next.js server.

**Browser-side requests** are for actions after the page is on screen. Use them when the customer changes a quantity, adds a line, or submits checkout and the screen should update from that response. The request originates in a Client Component and is subject to CORS.

A useful test: if the data is required to paint the page, the Next.js server requests it. If the customer just did something on the page, the browser requests it.

## 6. Backend responsibilities

`apps/api` is a Node.js process running Express. It is the only application that applies commerce rules and talks to PostgreSQL.

The request path inside Express is:

```
Route → Middleware → Controller → Service → Repository → Prisma → PostgreSQL
```

Each step has one job. A later step may skip a file only when that step would be an empty pass-through with no explained purpose. The checkout path uses every step, because it validates input, applies price and stock rules, and writes through Prisma.

### ASP.NET Core correspondence

| This API                     | Familiar ASP.NET Core piece                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `server.ts`                  | `Program.cs` host startup, `app.Run()`                                                  |
| `app.ts`                     | Middleware pipeline and endpoint mapping                                                |
| Route file                   | Attribute routing or `MapGroup`                                                         |
| Middleware                   | `app.Use...` middleware                                                                 |
| Controller                   | Controller action: read HTTP, call the application service, write the status code       |
| Service                      | Application service: the use case and its business rules                                |
| Repository                   | A focused data-access class. Concrete methods per query, not a generic `IRepository<T>` |
| Prisma Client                | EF Core `DbContext` and LINQ-to-entities                                                |
| Prisma schema and migrations | EF Core model and migrations                                                            |
| PostgreSQL                   | The database                                                                            |
| Zod schema on the route      | FluentValidation or data annotations on the request DTO                                 |
| Error middleware             | Exception-handling middleware                                                           |

### Bootstrap

`server.ts` reads the port and starts listening. `app.ts` builds the Express application: JSON body parsing, request logging, CORS for the web origin, routes, and the error middleware last.

Configuration comes from environment variables. Database credentials and the OpenAI key exist only in this process.

### Routes and middleware

A route file maps a method and path to a controller function. It attaches the validation schema and any auth middleware that route needs.

Middleware is for work that many routes share: assign a request id, parse JSON, enable CORS, require an authenticated user, require an admin role, and handle errors. Business rules for "can this quantity be ordered" belong in the service, not in middleware.

### Controllers

Controllers translate HTTP into a service call and a service result into HTTP. They read validated input, call one service method, and set the status code and JSON body.

They do not calculate totals, check stock, or call Prisma.

### Services and business rules

Services are the use cases: list products, get a product by slug, add a cart line, place an order. Rules live here.

Examples of rules, implemented when those modules are built:

- A product must be active to appear on the storefront.
- Cart quantity is a positive integer within the available stock.
- Checkout ignores any price sent by the client and reads the current price from the database.
- Inventory changes that belong to an order commit or roll back with that order.

### Repositories and Prisma

Repositories are the only module code that calls Prisma. A product repository has methods such as "find active product by slug" and "list products in a category". The service asks for those operations by name.

Prisma Client is constructed once and shared. The planned schema file is `apps/api/prisma/schema.prisma`. The web app does not get a copy.

### PostgreSQL

PostgreSQL is the system of record. Catalog, users, carts, inventory, and orders are rows in this database. Prisma migrations, run from the API, are the way the schema changes.

### Validation and errors

Every route that accepts input validates the body, query, and route parameters with Zod before the controller runs. Invalid input becomes a 400 response with a stable error shape.

Failures throw a small application error (status code plus a public message). One error-handling middleware, registered after the routes, turns that into JSON. Unexpected failures become a generic 500. The detailed error is logged on the server and is not sent to the client.

Planned error body:

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product was not found."
  }
}
```

### Authentication and authorization

Not implemented in this step.

When it is added, Express is the authority. Next.js may show or hide screens. Express accepts or rejects the operation.

The planned shape:

- A user module owns identity and credentials.
- Authentication middleware resolves the caller on protected routes.
- Authorization checks the role or ownership inside the use case. An admin catalog write requires an admin. A customer reads their own cart and orders.
- The web app sends the credential the later design chooses (cookie or bearer token). That choice is deferred until the auth step so the storage and CORS details are decided together.

Public catalog reads stay anonymous. Cart, checkout, and admin operations do not.

## 7. Module boundaries

Modules are folders inside `apps/api/src/modules`. They communicate through service methods in the same process. They do not call each other over HTTP.

| Module                   | Responsibility                                                                                         | Talks to                                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Products                 | Product identity, name, slug, description, price, active flag, and category assignment for the catalog | Categories. Inventory, for stock shown on a product page. AI may read product text later                                                                                      |
| Categories               | Category names and the grouping used by the catalog                                                    | Products                                                                                                                                                                      |
| Inventory                | On-hand quantity and the stock change that accompanies an order                                        | Products, for which item is stocked. Orders, when checkout commits a sale                                                                                                     |
| Users and authentication | Accounts, credentials, and roles (customer and admin)                                                  | Cart and Orders, which act for a user. Admin product and category writes                                                                                                      |
| Cart                     | The current set of product ids and quantities for a shopper                                            | Products, for identity and display data. Inventory, for an availability check. Users, when the cart belongs to an account. Orders, when checkout turns the cart into an order |
| Orders and checkout      | Place an order, snapshot the price, record lines, and own order status                                 | Cart, Products, Inventory, Users                                                                                                                                              |
| AI integrations          | Calls to the OpenAI API for assistance such as recommendations or draft catalog text                   | Products, and later Orders, as read-only context. It does not write prices, stock, or orders                                                                                  |

Dependency direction for a sale:

```
Orders → Cart, Products, Inventory, Users
Cart → Products, Inventory, Users
Inventory → Products
Products → Categories
AI → Products (read-only)
```

The AI module is a client of the catalog, not an owner of it. A suggestion from the model becomes a product change only when a product service method accepts that change through the normal validation path.

No domain model is defined in this step. Tables, fields, and aggregates are chosen when the first persistence step needs them.

## 8. Request flows

### Customer opens a product page

1. The browser requests `/products/classic-tee` from Next.js.
2. The product page is a Server Component. While rendering, the Next.js server calls Express: `GET /products/classic-tee`.
3. The product route validates the slug. The anonymous catalog middleware allows the request. The controller calls the product service.
4. The service applies catalog rules, including "only an active product is visible".
5. The product repository uses Prisma to load the product, its category, and the stock figure it needs from inventory.
6. Prisma queries PostgreSQL and returns rows. The service maps them to a response DTO. Express responds with `200` and JSON.
7. Next.js renders the name, price, and stock state into HTML. A Client Component on the page can later post "add to cart" to Express without rendering the whole product on the client.

If Express returns 404, Next.js renders the not-found state. If Express is down or exceeds the client timeout, Next.js renders the error state.

```
Browser
  → Next.js  GET /products/classic-tee
    → Express GET /products/classic-tee
      → validate slug
      → ProductController
      → ProductService
      → ProductRepository
      → Prisma
      → PostgreSQL
    ← JSON product
  ← HTML
```

### Checkout

Implemented in a later step. The flow is fixed now so the UI cannot grow its own pricing rules.

1. The customer reviews the cart and submits checkout from the checkout screen.
2. The browser, or the Next.js server acting for that submission, sends `POST /orders` with the cart id, line quantities, and shipping details. The body does not include a price that Express will trust.
3. Order route validation rejects a malformed body. Authentication middleware, once it exists, rejects an anonymous checkout if the product requires a signed-in customer.
4. The order service loads the cart through the cart service and loads each product through the product service. It uses the database price, not a client price.
5. The inventory service checks that each quantity is still available.
6. The order repository opens a Prisma transaction. Inside it: insert the order, insert lines with the snapshotted unit price, decrement inventory, and clear or close the cart. A failure rolls the transaction back. Stock is not reduced for an order that was not saved.
7. Express returns the new order id and a summary. Next.js renders the confirmation page from that response.

Payment capture is a later extension. The price check and the transactional stock update are part of the first real checkout, not optional extras.

## 9. Next.js and Express communication

### The HTTP boundary

REST over HTTP is the only contract between the two applications. JSON in, JSON out. Express routes are the published surface. Next.js depends on those routes and their DTOs, not on Prisma models.

A response DTO is a stable public shape. It can omit columns that exist only for the database. When both sides need a shared description of that shape, it moves to `packages/shared`. Until then, the API owns the shape and the web client mirrors it.

### Base URL

| Variable                   | Who reads it        | Purpose                                                                                       |
| -------------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `API_BASE_URL`             | Next.js server      | Server Component and other server-side calls. Example in development: `http://localhost:4000` |
| `NEXT_PUBLIC_API_BASE_URL` | Browser bundle      | Browser calls only. Same development origin as above                                          |
| `PORT`                     | Express             | API listen port. Development value: `4000`                                                    |
| `DATABASE_URL`             | Express only        | PostgreSQL connection string                                                                  |
| `OPENAI_API_KEY`           | Express only, later | OpenAI credential                                                                             |

`NEXT_PUBLIC_` values are embedded in JavaScript sent to the browser. `DATABASE_URL` and `OPENAI_API_KEY` must never use that prefix.

Example files live beside each app, not at the repository root. `apps/api/.env.example` documents `PORT` and `NODE_ENV`. `DATABASE_URL` and `OPENAI_API_KEY` are added when those features exist. `apps/web/.env.example` will document the API base URLs when the Next.js app is created. The root package does not run a server, so it has no `.env.example`.

### Development and production

|             | Web                     | API                     | Database                               |
| ----------- | ----------------------- | ----------------------- | -------------------------------------- |
| Development | Next.js on port 3000    | Express on port 4000    | Local or shared development PostgreSQL |
| Production  | The deployed web origin | The deployed API origin | Managed PostgreSQL                     |

The code reads the base URL from configuration. It does not hard-code `localhost` in pages. Production uses HTTPS origins.

### Browser-side and server-side requests

Server-side `fetch` runs from the Next.js server to Express. The browser never sees that hop, and browser CORS rules do not apply to it.

Browser `fetch` runs from the page's origin (port 3000 in development) to the API origin (port 4000). Those are different origins. Express must allow the web origin.

### CORS

CORS is required for browser calls from the web origin to the API origin. The planned middleware allows the configured web origin, the HTTP methods the API uses, and the headers the client sends.

Server-side Next.js calls do not use that middleware path as a security check. CORS is a browser rule. The API still authenticates protected browser calls normally.

A wildcard origin combined with credentials is invalid in browsers. When auth uses cookies, the allowed origin is the specific web origin.

### Authentication and credentials

Deferred to the auth step. The constraints are already set:

- Express issues and checks the credential.
- If the credential is a cookie, browser requests use credentialed `fetch`, and the cookie attributes (`HttpOnly`, `Secure`, `SameSite`) are chosen for the real web and API origins.
- If the credential is a bearer token, the web app stores and attaches it in a way the auth step will specify. It is not placed in `NEXT_PUBLIC_` variables.
- Server-side Next.js requests that act for a user forward that credential to Express. A Server Component does not skip authorization by calling a private function.

### Errors and timeouts

The web API client sets a timeout on every call. On timeout, the UI uses the error state. It does not wait indefinitely.

Non-2xx responses use the error JSON from section 6. The client maps `code` to the message on screen. A body that is not that shape is treated as an unexpected failure.

### Database access

Express is the only application that opens Prisma. The Next.js process receives JSON over HTTP.

That gives one place for validation, price checks, stock changes, transactions, and authorization. Catalog reads and checkout writes share the same rules. The web app can be redeployed without a database credential.

## 10. Security principles

These apply from the first feature onward.

1. Express is the trust boundary. The browser and Next.js are clients of that boundary.
2. Validate body, query, and route parameters on every route that accepts them.
3. Authorize every cart, order, and admin operation on the server. UI visibility is not authorization.
4. Recompute price and stock at checkout inside one database transaction.
5. Keep secrets in environment variables on the process that uses them. Do not commit `.env` files. The existing `.gitignore` already ignores them.
6. Return the public error shape to clients. Leave stack traces and SQL details in server logs.
7. Serve production traffic over HTTPS. Use secure cookie attributes if cookies are adopted.
8. Give the application a PostgreSQL role limited to the schema it uses.
9. Treat model output as untrusted input. An OpenAI response is not a price, a stock figure, or an authorization decision.
10. Add dependency and secret scanning in GitHub Actions when CI is introduced.

Authentication itself is a later step. Building catalog screens before that step is acceptable because public product reads are anonymous. Building checkout or admin writes before authorization is not.

## 11. Testing and deployment direction

Nothing here is installed or automated in this step.

### Testing, when code exists

| Layer         | What it proves                                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service tests | Business rules, using a stand-in repository. Price snapshot and rejected quantities belong here                                                            |
| API tests     | Validation, status codes, and the error shape. Checkout tests run against a database and assert the transaction: order saved and stock reduced, or neither |
| Web tests     | Loading, error, and empty states, plus one path from product page to checkout confirmation                                                                 |

Prisma queries are covered by the API tests that hit PostgreSQL. They are not re-tested through the UI.

### Deployment, when the apps exist

Three runtime pieces: the Next.js app, the Express API, and PostgreSQL.

- The API runs Prisma migrations as part of its release, before it serves traffic that depends on the new schema.
- Each environment supplies its own `API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `DATABASE_URL`, and later `OPENAI_API_KEY`.
- GitHub Actions workflows will live in `.github/workflows` when CI is added. The folder is only a placeholder today.
- The first production shape is one web service and one API service. It is not a container cluster and not a per-module deployment.

## 12. Decisions

| ID      | Decision                                                                                                                            | Status                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| ADR-001 | Modular monolith in a monorepo. One Express process, one PostgreSQL database, modules as folders                                    | Decided now                               |
| ADR-002 | Next.js owns UI and rendering. Express owns rules and data. Contract is HTTP JSON                                                   | Decided now                               |
| ADR-003 | Layering is route, middleware, controller, service, repository, Prisma, PostgreSQL                                                  | Decided now                               |
| ADR-004 | Zod validates input at the route. TypeScript types are not a substitute                                                             | Decided now. Library added with the API   |
| ADR-005 | Prisma schema lives in `apps/api`. The web app has no database client                                                               | Decided now                               |
| ADR-006 | `packages/shared` is used only for contracts both apps import                                                                       | Decided now                               |
| ADR-007 | Product pages load data with a server-side request. Cart and checkout mutations use a browser request after the page is interactive | Decided now                               |
| ADR-008 | Checkout stores the database price and updates inventory in one transaction                                                         | Decided now. Implemented with checkout    |
| ADR-009 | Express is the authentication and authorization authority                                                                           | Decided now. Mechanism implemented later  |
| ADR-010 | Cookie session versus bearer token                                                                                                  | Deferred to the auth step                 |
| ADR-011 | OpenAI is called only from the AI module on Express, read-only toward commerce data                                                 | Decided now. Implemented in a later phase |
| ADR-012 | Payment provider, email, and background jobs                                                                                        | Deferred until a feature needs them       |

### ADR-001 — Modular monolith

**Status:** Accepted

**Context:** The system needs catalog, cart, and checkout transactions, and the author is learning the Node.js stack.

**Decision:** One API process and one database. Modules are folders with a one-way dependency direction.

**Consequences:** Checkout can use a normal database transaction. A module can be extracted later only if operations require it. We do not operate a network of services in the meantime.

### ADR-002 — Express is the system of record's API

**Status:** Accepted

**Context:** Next.js can host server code, including database access. This project is practice for a separate backend, which is the usual .NET split.

**Decision:** Express is the only writer and the only reader of PostgreSQL. Next.js is an HTTP client.

**Consequences:** Two processes, a base URL, and CORS for browser calls. Business rules stay in one codebase that can be tested without rendering React.

### ADR-003 — Explicit layers

**Status:** Accepted

**Context:** A short route handler that queries Prisma is tempting for a single `GET /products` and becomes a problem when checkout, auth, and inventory share the process.

**Decision:** Use the layering in section 6. Repositories have specific methods. There is no generic repository base.

**Consequences:** More files per module. Controllers stay boring, and service tests can run without HTTP.

## 13. Trade-offs and future extension points

### Trade-offs accepted now

| Choice                        | What we gain                                                      | What we give up                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Two processes                 | A clear backend boundary and room to practice Express             | An extra network hop, CORS, and two deployment units                                                                |
| Modules in one database       | Transactions across orders and inventory                          | We must keep module dependencies one-directional by review, because the database will not enforce folder boundaries |
| Shared package used sparingly | Freedom to change an internal DTO without a package release dance | A type may be written twice until it is truly shared                                                                |
| Synchronous checkout          | A simple, correct stock update                                    | No queue to absorb a payment-provider outage. Payments are deferred for that reason                                 |
| Server-rendered product pages | Faster first view and a single catalog request                    | Interactive product UI must be split into small Client Components                                                   |

### Extension points

These are seams, not work started now.

- **Payments.** The order service can call a payment provider after the price is snapshotted and before or inside the same business transaction, depending on the provider's rules. The provider is not selected yet.
- **Email and receipts.** A later notification step can send mail after the order commits. If that work must leave the request, a job mechanism can be added then.
- **OpenAI.** The AI module is the only caller. It reads products through the product service.
- **Caching.** Public catalog responses can later gain HTTP caching or a CDN for images. Cached stock figures still lose to the checkout transaction, which reads current inventory.
- **Extracting a service.** A module with a narrow service interface can move to another process if scale or team structure requires it. That is a new decision, not the current architecture.

## Current step boundary

Step 02 recorded this architecture. The API now serves `GET /api/health` on port 4000. CORS, authentication, Prisma, and the Next.js app are still later work.
