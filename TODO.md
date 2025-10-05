# Deployment Plan for Full-Stack App on Vercel/Railway

## Code Changes
- [x] Update backend/server.js: Change CORS origins to use process.env.FRONTEND_URL
- [x] Update frontend/src/api/axios.js: Change baseURL to use import.meta.env.VITE_API_URL

## Deployment Steps
- [ ] Deploy backend on Railway with all env vars
- [ ] Deploy frontend on Vercel
- [ ] Update FRONTEND_URL in backend
- [ ] Test the deployed app
