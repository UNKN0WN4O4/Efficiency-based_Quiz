const { GoogleGenAI } = require("@google/genai");

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: "test" });
    console.log("SDK Initialized correctly");
  } catch (err) {
    console.error("Test Error:", err.message);
  }
}

test();
