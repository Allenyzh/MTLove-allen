export async function sendMessageToAPI(
  messages,
  API_KEY,
  userInputMessage
) {
  if (!userInputMessage.trim()) return;

  const newMessage = {
    role: "user",
    content: userInputMessage,
  };

  const updatedMessages = [...messages, newMessage];

  const requestBody = {
    model: "gemini-2.0-flash-exp",
    messages: updatedMessages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "compliance_result",
        schema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Response text.",
            },
            score: {
              type: "number",
              description: "Score of the response.",
            },
          },
          required: ["text", "score"],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  };

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    const jsonObj = JSON.parse(aiResponse);
    return {
      newMessage,
      aiResponse: { role: "assistant", content: jsonObj.text },
      score: jsonObj.score,
    };
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
