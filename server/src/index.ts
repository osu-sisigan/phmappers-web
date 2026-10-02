import 'dotenv/config'
import express from 'express'
import { config } from './config.ts'
import authRouter from "./modules/auth/auth.route.ts";
import cookieParser from 'cookie-parser';

const app = express()

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
app.use(cookieParser(config.cookieSecret));
app.use('/auth', authRouter);

app.listen(config.port, () => {
  console.log(`Listening on http://localhost:${config.port}`)
})
