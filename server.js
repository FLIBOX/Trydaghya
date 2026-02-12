const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const stt = require("./services/stt");
const llm = require("./services/llm");

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

const recordingsDir = path.join(__dirname, "recordings");
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

io.on("connection", (socket) => {
  console.log("client connected", socket.id);

  socket.on("audio.turn", async ({ audioBase64, mimeType }) => {
    try {
      if (!audioBase64) {
        socket.emit("agent.error", "No audio payload received.");
        return;
      }

      const extension = mimeType && mimeType.includes("ogg") ? "ogg" : "webm";
      const baseName = `${Date.now()}-${socket.id}`;
      const inputFile = path.join(recordingsDir, `${baseName}.${extension}`);
      fs.writeFileSync(inputFile, Buffer.from(audioBase64, "base64"));

      const transcript = await stt.transcribe(inputFile);
      socket.emit("stt", transcript || "");

      if (!transcript || !transcript.trim()) {
        socket.emit("ai", "ماسمعتكش مزيان، عاود قلها مرة أخرى.");
        return;
      }

      const reply = await llm.ask(transcript);
      socket.emit("ai", reply);
    } catch (error) {
      console.error("audio.turn failed", error);
      socket.emit(
        "agent.error",
        "حدث خطأ في المعالجة. تأكد أن Ollama و Whisper خدامين محلياً."
      );
    }
  });
});

server.listen(3000, () => {
  console.log("http://localhost:3000");
});
