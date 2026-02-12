const axios = require("axios");

const SYSTEM_PROMPT = `
أنت مساعد صوتي لمطعم مغربي.
تكلم بدارجة مغربية واضحة وبأسلوب محترم ومختصر.
ركز على: الترحيب، أخذ الطلب، توضيح الأطباق، الأسعار، ووقت التوصيل.
إذا كان السؤال خارج نطاق المطعم، جاوب بلطف ثم رجّع الحوار للطلب.
`;

exports.ask = async (text) => {
  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3",
    prompt: `${SYSTEM_PROMPT}\n\nالزبون: ${text}\nالمساعد:`,
    stream: false
  });

  return (res.data.response || "").trim();
};
