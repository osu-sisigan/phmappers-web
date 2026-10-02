import 'dotenv/config'
import express from 'express'
import { config } from './config.ts'
import authRouter from "./modules/auth/auth.route.ts";
import cookieParser from 'cookie-parser';

const app = express()

// JSON endpoints live under /api so the Vite dev server can proxy that prefix
// without colliding with client-side page routes. Auth stays at /auth because
// its cookie path and the osu! redirect URI are tied to that URL.
const api = express.Router()

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
app.use(cookieParser(config.cookieSecret));
app.use('/auth', authRouter);

app.use('/api', api)

app.listen(config.port, () => {
  console.log(`Listening on http://localhost:${config.port}`)
})
