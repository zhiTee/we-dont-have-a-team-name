'use client'

import { useState } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);

    try {
      const res = await fetch("/api/bedrock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data.response);
      } else {
        setResponse("Error: " + data.error);
      }
    } catch (err) {
      setResponse("Failed to fetch response.");
    }

    setLoading(false);
  }

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your message here"
        rows={4}
        cols={50}
      />
      <br />
      <button onClick={handleSend} disabled={loading || !input}>
        {loading ? "Sending..." : "Send"}
      </button>

      {response && (
        <div style={{ marginTop: 20 }}>
          <strong>Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
