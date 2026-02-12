# Trydaghya

Local Arabic (Darija) voice agent for restaurant call/testing scenarios.

## What is fixed
- Browser records microphone audio and sends one full turn to backend.
- Backend transcribes with Whisper, queries Ollama (`llama3`), and returns text response.
- Frontend speaks reply using browser `speechSynthesis` (Arabic).
- Prompt tuned for restaurant assistant behavior in Moroccan Darija.

## Requirements
1. Node.js 18+
2. Python + Whisper installed (`python -m pip install openai-whisper`)
3. FFmpeg installed and available in PATH (required by Whisper for webm decoding)
4. Ollama running locally with model:
   ```bash
   ollama pull llama3
   ollama serve
   ```

## Run
```bash
npm install
npm start
```
Then open: `http://localhost:3000`

## Notes
- Whisper command auto-detects python from `.venv` if available, otherwise uses `python`/`python3`.
- Current flow is push-to-talk (Start/Stop). You can later evolve to fully continuous streaming.
