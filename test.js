const llm = require("./services/llm");

(async () => {
  const r = await llm.ask("say hello like a moroccan shop owner");
  console.log(r);
})();
