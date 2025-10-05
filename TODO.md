# Deployment Plan for Full-Stack App on Vercel/Railway

## Code Changes
- [x] Update backend/server.js: Change CORS origins to use process.env.FRONTEND_URL
- [x] Update frontend/src/api/axios.js: Change baseURL to use import.meta.env.VITE_API_URL

## Deployment Steps
- [ ] Deploy backend on Railway
- [ ] Deploy frontend on Vercel
- [ ] Update environment variables
- [ ] Test the deployed app
