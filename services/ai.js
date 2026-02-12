const axios = require("axios");

exports.ask = async (text) => {

  const res = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "llama3",
      prompt: text,
      stream: false
    }
  );

  return res.data.response;
};
