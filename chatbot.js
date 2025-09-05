document.addEventListener("DOMContentLoaded", () => {
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const chatbotMessages = document.getElementById("chatbot-messages");

    // --- IMPORTANT ---
    // Replace with your own Gemini API key (for testing only).
    const API_KEY = "YOUR_API_KEY";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;


    // Function to format markdown-like text (**bold** → <b>bold</b>)
const formatMessage = (message) => {
  let formatted = message
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/\n/g, "<br>");

  // Convert numbered lists (1. Something) → <li>Something</li>
  formatted = formatted.replace(/(?:^|\n)(\d+)\.\s*(.*?)(?=\n|$)/g, "<li>$2</li>");

  // Wrap list items with <ol>
  if (formatted.includes("<li>")) {
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, "<ol>$1</ol>");
  }

  return formatted;
};

// Function to append messages
const appendMessage = (message, sender) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender === "user" ? "user-message" : "bot-message");

    // Use innerHTML for bot, innerText for user (to avoid injection issues)
    if (sender === "bot") {
        messageElement.innerHTML = formatMessage(message);
    } else {
        messageElement.innerText = message;
    }

    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return messageElement; // so we can update later
};


    // Fetch bot response
    const getBotResponse = async (userMessage) => {
        const thinkingMessage = appendMessage("Thinking...", "bot");

        try {
            const prompt = `You are a helpful and friendly skincare advisor. 
            A user has the following skin type: "${userMessage}".
            Please provide skincare suggestions for this skin type. Your response should be clear and well-organized. Include recommendations for:
            1. Cleanser: The type of cleanser to use.
            2. Toner: The type of toner to use.
            3. Moisturizer: The type of moisturizer to use.
            4. Key Ingredients: Ingredients to look for in products.
            5. Ingredients to Avoid: Ingredients to avoid.
            6. Product Examples: Suggest 2-3 popular products (cleanser, toner, moisturizer).`;

            const requestBody = {
                contents: [{
                    parts: [{ text: prompt }]
                }]
            };

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Network error.");
            }

            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const botResponse = data.candidates[0].content.parts[0].text;
               thinkingMessage.innerHTML = formatMessage(botResponse);

            } else {
                throw new Error("Invalid response format from API.");
            }
        } catch (error) {
            console.error("Error:", error);
            thinkingMessage.innerText = `❌ Error: ${error.message}`;
        }
    };

    // Handle input
    const handleUserInput = () => {
        const userMessage = userInput.value.trim();
        if (userMessage) {
            appendMessage(userMessage, "user");
            userInput.value = "";
            getBotResponse(userMessage);
        }
    };

    sendBtn.addEventListener("click", handleUserInput);
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleUserInput();
        }
    });
});

