// voice-loop.js - Windows-proof recorder + STT + AI + TTS loop
// Expects existing services: ./services/stt (async transcribe(filePath)),
// ./services/ai (async ask(text) -> reply), ./services/tts (async speak(text) -> wavPath)
// Uses bundled ffmpeg/ffplay in ./bin/ffmpeg/ffmpeg.exe and ffplay.exe

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const stt = require('./services/stt');
const ai = require('./services/ai');
const tts = require('./services/tts');

const ffmpegPath = path.join(__dirname, 'bin', 'ffmpeg', 'ffmpeg.exe');
const ffplayPath = path.join(__dirname, 'bin', 'ffmpeg', 'ffplay.exe');

// Friendly device name discovered from `ffmpeg -f dshow -list_devices true -i dummy`
const FRIENDLY_DEVICE = '麦克风阵列 (英特尔® 智音技术)';
// Alternative device name (guaranteed-works unique device id)
const ALT_DEVICE = '@device_cm_{33D9A762-90C8-11D0-BD43-00A0C911CE86}\\wave_{9167893D-FEF9-409C-BE50-84C228F0D480}';

const TEMP_WAV = 'temp.wav';
const RECORD_SECONDS = 3; // increase if you need longer capture
const MIN_ACCEPTABLE_BYTES = 30 * 1024; // 30 KB — below this is likely silence
const MAX_RETRIES = 4;

console.log('🎤 Listening...');

let attempt = 0;

async function recordOnce(preferredDevice = FRIENDLY_DEVICE) {
  attempt++;
  if (attempt > MAX_RETRIES) {
    console.error('❌ Max retries reached. Exiting.');
    process.exit(1);
  }

  // Always remove old temp if exists
  try { if (fs.existsSync(TEMP_WAV)) fs.unlinkSync(TEMP_WAV); } catch (e) {}

  console.log('🎙️ recording... (attempt', attempt, ')');

  // Build args for ffmpeg
  const deviceArg = `audio=${preferredDevice}`;
  const args = [
    '-y',
    '-f', 'dshow',
    '-i', deviceArg,
    '-t', String(RECORD_SECONDS),
    TEMP_WAV
  ];

  const rec = spawn(ffmpegPath, args, { windowsHide: true });

  rec.stderr.on('data', (data) => {
    // keep this enabled while debugging
    // console.log('ffmpeg:', data.toString());
  });

  rec.on('error', (err) => {
    console.log('❌ Recording failed (spawn error):', err);
  });

  return new Promise((resolve) => {
    rec.on('close', async (code) => {
      console.log('✅ recorded. Exit code:', code);

      // quick check: does file exist and has enough data?
      if (!fs.existsSync(TEMP_WAV)) {
        console.log('❌ temp.wav not found — retrying...');
        // If we used friendly device, try alternative once
        if (preferredDevice === FRIENDLY_DEVICE) return resolve(recordOnce(ALT_DEVICE));
        return resolve(recordOnce(FRIENDLY_DEVICE));
      }

      const size = fs.statSync(TEMP_WAV).size;
      console.log('file size:', size, 'bytes');

      if (size < MIN_ACCEPTABLE_BYTES) {
        console.log('⚠️ temp.wav seems too small (likely silence).');
        // try switching device once
        if (preferredDevice === FRIENDLY_DEVICE) {
          console.log('➡️ Retrying with alternative device identifier...');
          return resolve(recordOnce(ALT_DEVICE));
        }

        // otherwise retry with friendly again
        console.log('➡️ Retrying recording...');
        return resolve(recordOnce(FRIENDLY_DEVICE));
      }

      // File looks OK — proceed to STT
      try {
        const text = await stt.transcribe(TEMP_WAV);
        console.log('🧠 STT result:', text || '(empty)');

        if (!text || text.trim() === '') {
          console.log('⚠️ Empty transcription — listening again...');
          return resolve(recordOnce(preferredDevice));
        }

        console.log('🗣️ You:', text);

        const reply = await ai.ask(text);
        console.log('🤖 AI:', reply);

        const wav = await tts.speak(reply);
        console.log('🔊 Playing response...');

        const player = spawn(ffplayPath, ['-nodisp', '-autoexit', wav], { windowsHide: true });

        player.stderr.on('data', (d) => {}); // optional ffplay logs

        player.on('close', () => {
          console.log('🔁 Looping again...\n');
          attempt = 0; // reset attempt counter on success
          resolve(recordOnce(preferredDevice));
        });

      } catch (e) {
        console.log('❌ ERROR during processing:', e);
        // Retry the whole flow
        resolve(recordOnce(preferredDevice));
      }

    });
  });
}

// Start the loop
recordOnce().catch((e) => console.error('Unhandled error:', e));
