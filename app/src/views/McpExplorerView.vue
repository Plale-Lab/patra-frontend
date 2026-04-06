<template>
  <div>
    <div class="page-header">
      <h1>MCP Explorer</h1>
      <p>Browse tools, execute them, and read resources from the MCP server</p>
    </div>

    <!-- Connection Card -->
    <div class="card mcp-connection-card">
      <div class="card-header">
        <div class="flex items-center gap-8">
          <span class="status-dot" :class="mcp.connected ? 'connected' : 'disconnected'"></span>
          <span>{{ mcp.connected ? 'Connected' : 'Disconnected' }}</span>
        </div>
        <button
          class="btn"
          :class="mcp.connected ? 'btn-outline' : 'btn-primary'"
          :disabled="mcp.loading"
          @click="mcp.connected ? mcp.disconnect() : mcp.connect()"
        >
          <component :is="mcp.connected ? IconPlugConnectedX : IconPlugConnected" :size="16" stroke-width="1.8" />
          {{ mcp.connected ? 'Disconnect' : 'Connect' }}
        </button>
      </div>
      <div class="card-body error-banner" v-if="mcp.error">
        <IconAlertTriangle :size="16" stroke-width="1.8" />
        <span>{{ mcp.error }}</span>
      </div>
    </div>

    <!-- Tools & Execution Grid -->
    <div class="mcp-grid" v-if="mcp.connected">
      <!-- Tools Panel -->
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-8">
            <IconTerminal2 :size="18" stroke-width="1.8" />
            <span>Tools ({{ mcp.tools.length }})</span>
          </div>
        </div>
        <div class="card-body tool-list">
          <div
            v-for="tool in mcp.tools"
            :key="tool.name"
            class="tool-item"
            :class="{ active: selectedTool?.name === tool.name }"
            @click="selectTool(tool)"
          >
            <div class="tool-name">{{ tool.name }}</div>
            <div class="tool-desc" v-if="tool.description">{{ tool.description }}</div>
          </div>
          <div class="empty-tools" v-if="mcp.tools.length === 0">
            No tools available
          </div>
        </div>
      </div>

      <!-- Execution Panel -->
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-8">
            <IconPlayerPlay :size="18" stroke-width="1.8" />
            <span>{{ selectedTool ? selectedTool.name : 'Select a tool' }}</span>
          </div>
        </div>
        <div class="card-body" v-if="selectedTool">
          <div v-if="argFields.length > 0" class="arg-fields">
            <div class="form-group" v-for="field in argFields" :key="field.name">
              <label class="form-label">
                {{ field.name }}
                <span class="field-hint" v-if="field.type"> ({{ field.type }})</span>
              </label>
              <input
                class="form-input"
                v-model="argValues[field.name]"
                :placeholder="field.default !== undefined ? `default: ${field.default}` : ''"
              />
            </div>
          </div>
          <div v-else class="no-args">No arguments required</div>
          <button class="btn btn-primary" :disabled="mcp.loading" @click="executeTool">
            <IconPlayerPlay :size="16" stroke-width="1.8" />
            {{ mcp.loading ? 'Executing…' : 'Execute' }}
          </button>
          <pre class="result-block" v-if="toolResult !== null">{{ formatJson(toolResult) }}</pre>
        </div>
        <div class="card-body empty-tools" v-else>
          Click a tool on the left to get started
        </div>
      </div>
    </div>

    <!-- Resource Reader -->
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
            class="form-input"
            v-model="resourceUri"
            placeholder="e.g. modelcard://1"
            @keydown.enter="readResource"
          />
          <button class="btn btn-primary" :disabled="mcp.loading || !resourceUri" @click="readResource">
            <IconBook :size="16" stroke-width="1.8" />
            {{ mcp.loading ? 'Reading…' : 'Read' }}
          </button>
        </div>
        <pre class="result-block" v-if="resourceResult !== null">{{ formatJson(resourceResult) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useMcpStore } from '../stores/mcp'
import {
  IconTerminal2, IconPlugConnected, IconPlugConnectedX,
  IconPlayerPlay, IconBook, IconAlertTriangle,
} from '@tabler/icons-vue'

const mcp = useMcpStore()

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

function selectTool(tool) {
  selectedTool.value = tool
  toolResult.value = null
  // Reset arg values
  Object.keys(argValues).forEach((k) => delete argValues[k])
  if (tool.inputSchema?.properties) {
    for (const [name, schema] of Object.entries(tool.inputSchema.properties)) {
      argValues[name] = schema.default !== undefined ? String(schema.default) : ''
    }
  }
}

async function executeTool() {
  if (!selectedTool.value) return
  // Build args, omitting empty strings
  const args = {}
  for (const [k, v] of Object.entries(argValues)) {
    if (v !== '') args[k] = v
  }
  try {
    const result = await mcp.callTool(selectedTool.value.name, args)
    toolResult.value = result
  } catch {
    toolResult.value = { error: mcp.error }
  }
}

async function readResource() {
  if (!resourceUri.value) return
  try {
    const result = await mcp.readResource(resourceUri.value)
    resourceResult.value = result
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

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot.connected { background: var(--color-success, #22c55e); }
.status-dot.disconnected { background: var(--color-danger, #ef4444); }

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-danger, #ef4444);
  background: var(--color-danger-bg, #fef2f2);
  border-radius: 0 0 var(--radius-md, 8px) var(--radius-md, 8px);
  font-size: .85rem;
}

.mcp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.tool-list {
  max-height: 420px;
  overflow-y: auto;
  padding: 0;
}

.tool-item {
  padding: 12px 18px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border, #eee);
  transition: background var(--transition, .15s);
}
.tool-item:last-child { border-bottom: none; }
.tool-item:hover { background: var(--color-bg, #f8f8fa); }
.tool-item.active { background: var(--color-primary-bg, #eef2ff); }

.tool-name { font-weight: 600; font-size: .9rem; }
.tool-desc { font-size: .78rem; color: var(--color-text-muted, #888); margin-top: 2px; }

.empty-tools {
  text-align: center;
  color: var(--color-text-muted, #888);
  padding: 32px 16px;
  font-size: .88rem;
}

.arg-fields { margin-bottom: 16px; }
.arg-fields .form-group { margin-bottom: 12px; }
.field-hint { font-weight: 400; color: var(--color-text-muted, #888); font-size: .78rem; }
.no-args { color: var(--color-text-muted, #888); font-size: .85rem; margin-bottom: 16px; }

.result-block {
  margin-top: 16px;
  padding: 14px;
  background: var(--color-bg, #f8f8fa);
  border: 1px solid var(--color-border, #eee);
  border-radius: var(--radius-sm, 6px);
  font-size: .8rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
}

.mcp-resource-card { margin-top: 20px; }

.resource-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.resource-row .form-input { flex: 1; }
</style>
