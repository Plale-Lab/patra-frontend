/**
 * Browser MCP client using EventSource (SSE) + fetch (JSON-RPC).
 */
export function createMcpClient(baseUrl) {
  let eventSource = null
  let endpointUrl = null
  let connected = false
  let requestId = 0
  const pending = new Map()

  function connect() {
    return new Promise((resolve, reject) => {
      eventSource = new EventSource(`${baseUrl}/sse`)

      eventSource.addEventListener('endpoint', (e) => {
        // Use the full URL the server provides (preserves path + query exactly)
        endpointUrl = new URL(e.data, baseUrl).href
        connected = true
        resolve()
      })

      eventSource.addEventListener('message', (e) => {
        let data
        try {
          data = JSON.parse(e.data)
        } catch {
          return
        }
        if (data.id != null && pending.has(data.id)) {
          const { resolve: res, reject: rej } = pending.get(data.id)
          pending.delete(data.id)
          if (data.error) {
            rej(new Error(data.error.message || 'MCP error'))
          } else {
            res(data.result)
          }
        }
      })

      eventSource.onerror = () => {
        if (!connected) {
          reject(new Error('SSE connection failed'))
        }
      }
    })
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    endpointUrl = null
    connected = false
    for (const { reject } of pending.values()) {
      reject(new Error('Disconnected'))
    }
    pending.clear()
  }

  async function _post(body) {
    if (!connected || !endpointUrl) {
      throw new Error('Not connected')
    }
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
  }

  async function _send(method, params = {}) {
    const id = ++requestId
    await _post({ jsonrpc: '2.0', id, method, params })
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
    })
  }

  async function _notify(method, params) {
    const body = { jsonrpc: '2.0', method }
    if (params !== undefined) body.params = params
    await _post(body)
  }

  async function initialize() {
    const result = await _send('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'patra-frontend', version: '0.3.0' },
    })
    // MCP protocol requires this notification before any other calls
    await _notify('notifications/initialized')
    return result
  }

  async function listTools() {
    return _send('tools/list')
  }

  async function callTool(name, args = {}) {
    return _send('tools/call', { name, arguments: args })
  }

  async function readResource(uri) {
    return _send('resources/read', { uri })
  }

  return {
    connect,
    disconnect,
    initialize,
    listTools,
    callTool,
    readResource,
    get isConnected() {
      return connected
    },
  }
}
