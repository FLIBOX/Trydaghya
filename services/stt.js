// services/stt.js
const fs = require('fs');           // ⬅️ add this
const { exec } = require('child_process');

function transcribe(filePath) {
  return new Promise((resolve, reject) => {
    const cmd = `.venv\\Scripts\\python -m whisper "${filePath}" --model medium --language Arabic --task transcribe --output_format txt`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);
      // Whisper creates a txt file next to temp.wav
      const txtFile = filePath.replace('.wav', '.txt');
      fs.readFile(txtFile, 'utf8', (e, data) => {
        if (e) return reject(e);
        resolve(data.trim());
      });
    });
  });
}

module.exports = { transcribe };
