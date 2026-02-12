const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.speak = (text) =>
  new Promise((resolve, reject) => {

    const baseDir = path.join(__dirname, "..");

    const piperPath = path.join(baseDir, "bin", "piper", "piper.exe");

    const modelPath = path.join(
      baseDir,
      "bin",
      "piper",
      "models",
      "ar_JO-kareem-medium.onnx"
    );

    const recordingsDir = path.join(baseDir, "recordings");

    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir);
    }

    const outFile = path.join(recordingsDir, `reply_${Date.now()}.wav`);

    const piper = spawn(piperPath, [
      "--model",
      modelPath,
      "--output_file",
      outFile
    ]);

    piper.stdin.write(text);
    piper.stdin.end();

    piper.stderr.on("data", (d) => console.log(d.toString()));

    piper.on("close", (code) => {
      if (code === 0) resolve(outFile);
      else reject(new Error("Piper failed"));
    });

    piper.on("error", reject);
  });
