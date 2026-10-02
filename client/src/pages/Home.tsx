import { useEffect, useState } from 'react'

type ApiStatus = 'checking' | 'ok' | 'unreachable'

function Home() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    const controller = new AbortController()

    // Relative URL: Vite proxies /api to the Express server in development.
    fetch('/api/health', { signal: controller.signal })
      .then((res) => setApiStatus(res.ok ? 'ok' : 'unreachable'))
      .catch(() => {
        // Aborts happen on unmount (and StrictMode's double effect); ignore them.
        if (!controller.signal.aborted) setApiStatus('unreachable')
      })

    return () => controller.abort()
  }, [])

  return (
    <>
      <h1>salamat acno</h1>
      <p>
        API: <code>{apiStatus}</code>
      </p>
    </>
  )
}

export default Home
