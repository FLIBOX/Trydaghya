const tts = require("./services/tts");

(async () => {
  const file = await tts.speak("واش خبارك بيخير راني باغي ناخد واحد جوج طاكوس يكونو ميكس ");
  console.log(file);
})();
