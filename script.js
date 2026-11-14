// Replace this with the URL of your deployed Cloudflare Worker.
const WORKER_URL = "https://my-api-worker.amoham97.workers.dev";

/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendButton = document.getElementById("sendBtn");

// Keep the conversation so the assistant can use earlier messages.
const messages = [];

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Add one message to the chat window without treating user text as HTML.
function addMessage(role, content) {
  const message = document.createElement("p");
  message.className = `msg ${role === "user" ? "user" : "ai"}`;
  message.textContent = `${role === "user" ? "You" : "Assistant"}: ${content}`;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Send the user's message to the Cloudflare Worker */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) {
    return;
  }

  messages.push({ role: "user", content: userMessage });
  addMessage("user", userMessage);
  userInput.value = "";
  sendButton.disabled = true;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Worker request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error("The Worker returned an unexpected response.");
    }

    messages.push({ role: "assistant", content: reply });
    addMessage("assistant", reply);
  } catch (error) {
    console.error(error);
    addMessage("assistant", "Sorry, I could not reach the chatbot. Please try again.");
  } finally {
    sendButton.disabled = false;
    userInput.focus();
  }
});
