import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function bibleApiProxy(apiKey: string): Plugin {
  return {
    name: 'star-room-bible-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/bible', (req, res) => {
        void (async () => {
          const incoming = new URL(req.url ?? '/', 'http://localhost')
          if (incoming.pathname === '/status') {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(JSON.stringify({ configured: Boolean(apiKey) }))
            return
          }

          if (req.method !== 'GET' || !/^\/(books|bibles)(\/|$)/.test(incoming.pathname)) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Endpoint não encontrado.' }))
            return
          }

          if (!apiKey) {
            res.statusCode = 503
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Falta configurar BIBLELEXICON_API_KEY no arquivo .env.local.' }))
            return
          }

          const target = new URL(`/api/v1${incoming.pathname}${incoming.search}`, 'https://biblelexicon.com.br')
          try {
            const upstream = await fetch(target, {
              headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
            })
            const body = await upstream.text()
            res.statusCode = upstream.status
            res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(body)
          } catch {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Não foi possível contactar o serviço bíblico. Verifica a ligação e tenta novamente.' }))
          }
        })().catch(() => {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'Erro inesperado no proxy bíblico.' }))
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), bibleApiProxy(env.BIBLELEXICON_API_KEY ?? '')],
  }
})
