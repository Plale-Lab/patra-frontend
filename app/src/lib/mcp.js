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

      eventSource.addEventListener('endpoint', (event) => {
        endpointUrl = new URL(event.data, baseUrl).href
        connected = true
        resolve()
      })

      eventSource.addEventListener('message', (event) => {
        let data
        try {
          data = JSON.parse(event.data)
        } catch {
          return
        }

        if (data.id != null && pending.has(data.id)) {
          const { resolve: resolvePending, reject: rejectPending } = pending.get(data.id)
          pending.delete(data.id)
          if (data.error) {
            rejectPending(new Error(data.error.message || 'MCP error'))
          } else {
            resolvePending(data.result)
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

  async function post(body) {
    if (!connected || !endpointUrl) {
      throw new Error('Not connected')
    }
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
  }

  async function send(method, params = {}) {
    const id = ++requestId
    await post({ jsonrpc: '2.0', id, method, params })
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
    })
  }

  async function notify(method, params) {
    const body = { jsonrpc: '2.0', method }
    if (params !== undefined) body.params = params
    await post(body)
  }

  async function initialize() {
    const result = await send('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'patra-dev', version: '0.7.0' },
    })
    await notify('notifications/initialized')
    return result
  }

  async function listTools() {
    return send('tools/list')
  }

  async function callTool(name, args = {}) {
    return send('tools/call', { name, arguments: args })
  }

  async function readResource(uri) {
    return send('resources/read', { uri })
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
