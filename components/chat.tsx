"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Send } from "lucide-react"

type Message = {
  id: number
  role: "user" | "assistant"
  content: string
}

export default function Chat() {
  const [messages, setMessages] = React.useState<Message[]>([
    { id: 1, role: "assistant", content: "Hello! How can I help you today?" },
  ])
  const [input, setInput] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")

    // TODO: Call your AI backend here (Bedrock, OpenAI, etc.)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: "This is a bot reply 🚀" },
      ])
    }, 800)
  }

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className="w-full max-w-lg mx-auto h-[600px] flex flex-col shadow-md rounded-2xl">
      <CardContent className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "px-3 py-2 rounded-lg text-sm max-w-[80%]",
              msg.role === "user"
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-muted"
            )}
          >
            {msg.content}
          </div>
        ))}
        <div ref={scrollRef} />
      </CardContent>

      <div className="border-t p-3 flex items-center gap-2">
        <Input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="icon" onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
