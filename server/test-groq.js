require('dotenv').config({ path: 'server/.env' });
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testGroq() {
  try {
    console.log("Sending test message to Groq (llama-3.1-8b-instant)...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "Hello, pouchAI is ready!" if you can hear me.' }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 50,
    });
    console.log("Response:", chatCompletion.choices[0]?.message?.content);
    console.log("✅ Bot is working!");
  } catch (error) {
    console.error("❌ Bot failed:", error.message);
  }
}

testGroq();
