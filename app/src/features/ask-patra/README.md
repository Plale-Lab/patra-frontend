# Ask Patra

Files:
- `AskPatraView.vue`: conversational assistant page
- `api.js`: frontend client for `/api/ask-patra/*`

Behavior:
- Uses starter prompts from backend bootstrap
- Sends chat turns to the backend OpenAI-compatible provider abstraction
- Shows cited records returned by backend search/context assembly
