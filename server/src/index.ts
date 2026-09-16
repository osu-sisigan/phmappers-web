import 'dotenv/config'
import express from 'express'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
})
