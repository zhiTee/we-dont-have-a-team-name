'use client'

import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function Chat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSend() {
    setLoading(true);
    setLoading(false);
  }

  return (
    <div>
      <h1>Hello world</h1>

      <button onClick={() => router.push('/ai_sample_1')}>
      Go to AI Sample 1
    </button>
    </div>
  );
}
