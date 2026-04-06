import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createMcpClient } from '@/lib/mcp'
import { MCP_BASE_URL } from '@/config/api'

export const useMcpStore = defineStore('mcp', () => {
  const connected = ref(false)
  const tools = ref([])
  const lastResult = ref(null)
  const loading = ref(false)
  const error = ref(null)

  let client = null

  async function connect() {
    error.value = null
    loading.value = true
    try {
      client = createMcpClient(MCP_BASE_URL)
      await client.connect()
      await client.initialize()
      connected.value = true
      const res = await client.listTools()
      tools.value = res.tools || []
    } catch (e) {
      error.value = e.message
      connected.value = false
    } finally {
      loading.value = false
    }
  }

  function disconnect() {
    if (client) {
      client.disconnect()
      client = null
    }
    connected.value = false
    tools.value = []
    lastResult.value = null
  }

  async function callTool(name, args = {}) {
    error.value = null
    loading.value = true
    try {
      const result = await client.callTool(name, args)
      lastResult.value = result
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function readResource(uri) {
    error.value = null
    loading.value = true
    try {
      const result = await client.readResource(uri)
      lastResult.value = result
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return { connected, tools, lastResult, loading, error, connect, disconnect, callTool, readResource }
})
