<template>
  <div>
    <div class="page-header">
      <h1>MCP Explorer</h1>
      <p>Inspect MCP tools, execute calls, and read resources from the configured MCP endpoint.</p>
    </div>

    <div class="loading-bar warning-bar">
      MCP Explorer is always visible in this build. If the MCP endpoint is not configured or reachable, the page will stay available and show connection warnings instead of being hidden.
    </div>

    <div class="card mcp-connection-card">
      <div class="card-header">
        <div class="flex items-center gap-8">
          <span class="status-dot" :class="mcp.connected ? 'connected' : 'disconnected'"></span>
          <span>{{ mcp.connected ? 'Connected' : 'Disconnected' }}</span>
          <span class="mcp-endpoint text-muted">{{ mcpBaseUrl }}</span>
        </div>
        <button
          class="btn"
          :class="mcp.connected ? 'btn-outline' : 'btn-primary'"
          :disabled="mcp.loading"
          @click="mcp.connected ? mcp.disconnect() : connect()"
        >
          <component :is="mcp.connected ? IconPlugConnectedX : IconPlugConnected" :size="16" stroke-width="1.8" />
          {{ mcp.connected ? 'Disconnect' : 'Connect' }}
        </button>
      </div>
      <div v-if="mcp.error" class="card-body error-banner">
        <IconAlertTriangle :size="16" stroke-width="1.8" />
        <span>{{ mcp.error }}</span>
      </div>
    </div>

    <div class="mcp-grid" v-if="mcp.connected">
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-8">
            <IconTerminal2 :size="18" stroke-width="1.8" />
            <span>Tools ({{ mcp.tools.length }})</span>
          </div>
        </div>
        <div class="card-body tool-list">
          <button
            v-for="tool in mcp.tools"
            :key="tool.name"
            type="button"
            class="tool-item"
            :class="{ active: selectedTool?.name === tool.name }"
            @click="selectTool(tool)"
          >
            <div class="tool-name">{{ tool.name }}</div>
            <div v-if="tool.description" class="tool-desc">{{ tool.description }}</div>
          </button>
          <div v-if="mcp.tools.length === 0" class="empty-tools">No tools available.</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-8">
            <IconPlayerPlay :size="18" stroke-width="1.8" />
            <span>{{ selectedTool ? selectedTool.name : 'Select a tool' }}</span>
          </div>
        </div>
        <div class="card-body" v-if="selectedTool">
          <div v-if="argFields.length > 0" class="arg-fields">
            <div v-for="field in argFields" :key="field.name" class="form-group">
              <label class="form-label">
                {{ field.name }}
                <span v-if="field.type" class="field-hint">({{ field.type }})</span>
              </label>
              <input
                v-model="argValues[field.name]"
                class="form-input"
                :placeholder="field.default !== undefined ? `default: ${field.default}` : ''"
              />
            </div>
          </div>
          <div v-else class="no-args">No arguments required.</div>

          <button class="btn btn-primary" :disabled="mcp.loading" @click="executeTool">
            <IconPlayerPlay :size="16" stroke-width="1.8" />
            {{ mcp.loading ? 'Executing...' : 'Execute' }}
          </button>

          <pre v-if="toolResult !== null" class="result-block">{{ formatJson(toolResult) }}</pre>
        </div>
        <div v-else class="card-body empty-tools">Select a tool to inspect its inputs and execute it.</div>
      </div>
    </div>

    <div class="card mcp-resource-card" v-if="mcp.connected">
      <div class="card-header">
        <div class="flex items-center gap-8">
          <IconBook :size="18" stroke-width="1.8" />
          <span>Resource Reader</span>
        </div>
      </div>
      <div class="card-body">
        <div class="resource-row">
          <input
            v-model="resourceUri"
            class="form-input"
            placeholder="e.g. modelcard://1"
            @keydown.enter="readResource"
          />
          <button class="btn btn-primary" :disabled="mcp.loading || !resourceUri" @click="readResource">
            <IconBook :size="16" stroke-width="1.8" />
            {{ mcp.loading ? 'Reading...' : 'Read' }}
          </button>
        </div>
        <pre v-if="resourceResult !== null" class="result-block">{{ formatJson(resourceResult) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  IconAlertTriangle,
  IconBook,
  IconPlayerPlay,
  IconPlugConnected,
  IconPlugConnectedX,
  IconTerminal2,
} from '@tabler/icons-vue'
import { useMcpStore } from '../../stores/mcp'
import { MCP_BASE_URL } from '../../config/api'

const mcp = useMcpStore()

const mcpBaseUrl = MCP_BASE_URL
const selectedTool = ref(null)
const argValues = reactive({})
const toolResult = ref(null)
const resourceUri = ref('')
const resourceResult = ref(null)

const argFields = computed(() => {
  if (!selectedTool.value?.inputSchema?.properties) return []
  return Object.entries(selectedTool.value.inputSchema.properties).map(([name, schema]) => ({
    name,
    type: schema.type,
    default: schema.default,
  }))
})

async function connect() {
  await mcp.connect()
}

function selectTool(tool) {
  selectedTool.value = tool
  toolResult.value = null
  Object.keys(argValues).forEach((key) => delete argValues[key])
  if (tool.inputSchema?.properties) {
    for (const [name, schema] of Object.entries(tool.inputSchema.properties)) {
      argValues[name] = schema.default !== undefined ? String(schema.default) : ''
    }
  }
}

async function executeTool() {
  if (!selectedTool.value) return
  const args = {}
  for (const [key, value] of Object.entries(argValues)) {
    if (value !== '') args[key] = value
  }
  try {
    toolResult.value = await mcp.callTool(selectedTool.value.name, args)
  } catch {
    toolResult.value = { error: mcp.error }
  }
}

async function readResource() {
  if (!resourceUri.value) return
  try {
    resourceResult.value = await mcp.readResource(resourceUri.value)
  } catch {
    resourceResult.value = { error: mcp.error }
  }
}

function formatJson(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

onMounted(() => {
  mcp.connect()
})
</script>

<style scoped>
.mcp-connection-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mcp-endpoint {
  font-size: 0.8rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.connected { background: var(--color-success); }
.status-dot.disconnected { background: var(--color-danger); }

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-danger);
  background: var(--color-danger-bg);
  font-size: 0.85rem;
}

.warning-bar {
  margin-bottom: 16px;
  background: color-mix(in srgb, var(--color-warning, #f59e0b) 10%, white);
  color: color-mix(in srgb, var(--color-warning, #b45309) 80%, black);
  border: 1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 35%, white);
}

.mcp-grid {
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.tool-list {
  max-height: 520px;
  overflow-y: auto;
  padding: 0;
}

.tool-item {
  width: 100%;
  text-align: left;
  padding: 14px 18px;
  border: none;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
}

.tool-item:last-child {
  border-bottom: none;
}

.tool-item:hover {
  background: var(--color-bg-elevated);
}

.tool-item.active {
  background: var(--color-primary-bg);
}

.tool-name {
  font-weight: 600;
  font-size: 0.92rem;
}

.tool-desc {
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.empty-tools {
  padding: 28px 18px;
  color: var(--color-text-muted);
}

.arg-fields {
  margin-bottom: 18px;
}

.field-hint {
  margin-left: 4px;
  font-weight: 400;
  color: var(--color-text-muted);
}

.no-args {
  color: var(--color-text-muted);
  margin-bottom: 16px;
}

.result-block {
  margin-top: 16px;
  padding: 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 420px;
  overflow-y: auto;
}

.mcp-resource-card {
  margin-top: 20px;
}

.resource-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.resource-row .form-input {
  flex: 1;
}

@media (max-width: 1080px) {
  .mcp-grid {
    grid-template-columns: 1fr;
  }
}
</style>
