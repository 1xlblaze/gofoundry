# GoFoundry

Interactive Go learning platform with a unique **Foundry HEAT** method:

**Hear → Etch → Anchor → Temper**

- How to think + how to answer interview scripts
- draw.io–style diagrams in lessons
- DSA, concepts, internals, LLD, HLD in idiomatic Go
- Quizzes + local progress
- Google Sign-In (Auth.js) + optional Keycloak OIDC

## Develop

```bash
npm install
cp .env.example .env.local   # fill Google / Keycloak / AUTH_SECRET
npm run dev
```

## Auth env

```
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# optional Keycloak
KEYCLOAK_CLIENT_ID=
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ISSUER=https://your-keycloak/realms/your-realm
```

Google redirect URI: `http://localhost:3000/api/auth/callback/google`

## Deploy

Vercel (Node runtime — not static export). Connect the GitHub repo and set the env vars above.
