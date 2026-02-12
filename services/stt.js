const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

function resolvePythonCommand() {
  const candidates = [
    ".venv/Scripts/python.exe",
    ".venv/bin/python",
    "python",
    "python3"
  ];

  return candidates.find((candidate) => {
    if (candidate.includes(".venv")) {
      return fs.existsSync(path.join(__dirname, "..", candidate));
    }
    return true;
  });
}

function transcribe(filePath) {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(filePath);
    const python = resolvePythonCommand();

    const cmd = `${python} -m whisper "${filePath}" --model small --language Arabic --task transcribe --output_dir "${outputDir}" --output_format txt`;

    exec(cmd, { cwd: path.join(__dirname, "..") }, (err) => {
      if (err) return reject(err);

      const txtFile = path.join(
        outputDir,
        `${path.basename(filePath, path.extname(filePath))}.txt`
      );

      fs.readFile(txtFile, "utf8", (readErr, data) => {
        if (readErr) return reject(readErr);
        resolve(data.trim());
      });
    });
  });
}

module.exports = { transcribe };
