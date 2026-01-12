# Firebase Functions (Chat + RAG)

This folder contains the backend required for the conversational homepage.

## What lives here
- `src/index.ts`: exports the HTTPS function `chat` (Firebase Gen 2) used by the frontend.
- `src/rag/*`: markdown chunking, embeddings, retrieval, and prompt assembly.
- `scripts/build-rag-index.ts`: builds the embeddings index from repo markdown.

## Secrets
The Gemini key must **never** be exposed to the client.

- **Runtime (deployed function)**: set a Firebase secret named `GEMINI_API_KEY` (Gen 2) so it is available to the function.\n\n- **Deploy-time index build**: the `firebase.json` predeploy hook runs `build:index`, which needs `GEMINI_API_KEY` in the environment of the deploy machine/CI. A simple approach is to set `GEMINI_API_KEY` in a local `.env` (repo root) and ensure your deploy environment exports it.

## Rebuilding the index locally
From repo root (after installing dependencies in `functions/`):
\n
- `npm --prefix functions run build`\n- `npm --prefix functions run build:index`
\n
The runtime index is written to `functions/lib/src/rag/index.json`.


