import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'save-project',
      configureServer(server) {
        server.middlewares.use('/api/save', async (req, res, next) => {
          if (req.method !== 'POST') return next()
          try {
            const chunks: Buffer[] = []
            for await (const chunk of req) {
              chunks.push(chunk)
            }
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            const filename = body.filename || 'project.yaml'
            // Only allow saving under the project root.
            const target = path.resolve(__dirname, filename)
            if (!target.startsWith(path.resolve(__dirname))) {
              res.statusCode = 403
              res.end(JSON.stringify({ error: 'Invalid path' }))
              return
            }
            fs.writeFileSync(target, body.yaml, 'utf8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, path: target }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(err) }))
          }
        })
      },
    },
  ],
})
