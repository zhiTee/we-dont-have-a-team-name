import Chat from "@/components/chat"
'use client'

import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function Chat() {
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