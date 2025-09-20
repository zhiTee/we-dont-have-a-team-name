'use client'
import Chat from "@/components/chat"

import { useState } from "react";

export default function MainPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    setLoading(false);
  }

  return (
    <div>
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Chat />
      </main>
    </div>
  );
}