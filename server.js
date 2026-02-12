const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const stt = require("./services/stt");
const llm = require("./services/llm");
const tts = require("./services/tts");

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {

  console.log("client connected");

  let buffers = [];

  // receive audio chunks
  socket.on("audio.chunk", async (chunk) => {
    buffers.push(Buffer.from(chunk));

    // كل 2 ثواني نعالجو
    if (buffers.length > 8) {
      const file = `recordings/${Date.now()}.wav`;
      fs.writeFileSync(file, Buffer.concat(buffers));
      buffers = [];

      const text = await stt.transcribe(file);
      socket.emit("stt", text);

      const reply = await llm.ask(text);
      socket.emit("ai", reply);

      const audio = await tts.speak(reply);
      socket.emit("tts", audio);
    }
  });

});

server.listen(3000, () =>
  console.log("http://localhost:3000")
);
