# Dynamic RBAC for Better Auth

Role-based access control built with [Next.js](https://nextjs.org) and
[Better Auth](https://better-auth.com), where **roles and permissions live in
the database and are edited from an admin page** — not hard-coded.

Better Auth's built-in access control defines roles in code, so adding a role
or changing what one can do means a redeploy. Here an admin creates a role,
ticks the permissions it should have, and assigns users to it, and the change
takes effect straight away.

## What it shows

- **Database-backed roles.** Three built-in roles (`admin`, `agent`,
  `endUser`) plus any number of custom roles created from the UI. Built-in
  roles can't be deleted or renamed.
- **A permission grid.** Nine resources × four actions (create, read, update,
  delete), edited per role with checkboxes.
- **A sidebar that follows your permissions.** You only see resources your role
  can read.
- **Row-level filtering on invoices.** Admins see every invoice, end users see
  their own, and agents see only the invoices of users they've been granted.
- **Access grants.** An admin can give an agent access to one specific user's
  invoices.
- **One request for many checks.** The dashboard asks about all 36
  resource-action pairs in a single call to `/api/check-permission`, instead of
  36 separate requests.

### Failing closed

Unrecognised roles are denied, not allowed. Earlier in development a custom
role fell through to the branch that shows every invoice — so a role meant to
see only its own data could read everyone's. It now falls back to "own data
only". Any role the code doesn't know about gets the least access, never the
most.

## Running it

Needs Node 22.

```bash
npm install
cp .env.example .env      # then set BETTER_AUTH_SECRET
npm run migrate           # create the tables
npm run seed              # add the sample users, roles and permissions
npm run dev               # http://localhost:3007
```

### Sample accounts

All use the password `password123`. The sign-in page lists them — click one to
sign in.

| Email | Role | Can |
| --- | --- | --- |
| `alice@example.com` | admin | everything, including the admin page |
| `bob@example.com` | agent | read everything except the admin page, full access to reports, and Carol's invoices |
| `carol@example.com` | endUser | read most things, add payments and payment methods, see only their own invoices; no reports |
| `dave@example.com` | endUser | as above |
| `erin@example.com` | endUser | as above |

Bob is a member of the **Acme Corp** organization, and has been granted access
to Carol's invoices.

All companies, people and numbers in the sample data are fictional.

### Opening it from another machine

To use the app from another computer on your network, set the three commented
lines in `.env.example` to this machine's address. The auth API only accepts
requests from origins it's told about.

## How it's built

```
src/
├── app/
│   ├── (auth)/              sign in, sign up
│   ├── (app)/               the signed-in app
│   │   ├── dashboard/       your role's full permission grid
│   │   ├── admin/           users, roles and grants tabs
│   │   └── resource/        one page per resource; invoices have their own
│   └── api/
│       ├── check-permission/     batch permission checks
│       ├── sidebar-permissions/  which resources you can see
│       ├── roles/                create, edit and delete roles
│       └── agent-grants/         give an agent access to a user's invoices
├── components/admin/        the three admin tabs
├── lib/
│   ├── auth.ts              Better Auth server setup
│   ├── constants.ts         the 9 resources and 4 actions
│   └── resource-config.ts   sample data for each resource
└── scripts/                 migrate and seed
```

Roles and permissions are two tables: `role`, and `role_permission` with one
row per role, resource and action. A check is a lookup in `role_permission` for
the signed-in user's role. Better Auth still handles sign-in, sessions and user
management.

Stack: Next.js 16, React 19, Better Auth, SQLite (`better-sqlite3`), Tailwind
CSS 4, TypeScript.

## Limitations

- **Resource pages use sample data.** Invoices, products and the rest are
  fixed records, and their create, edit and delete buttons aren't connected to
  a backend. Users, roles, permissions and grants are real and saved.
- **No automated tests.** It was tested by hand across the roles.
- **Organization features are switched off.** The organization-membership
  check for agents and the organization card on the profile page are left in
  as comments so they can be turned back on.
