"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Send, Loader2, Mic, Camera } from "lucide-react"


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

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const handlePickMedia =() => fileInputRef.current?.click()
  const handleRecordVoice = () => {
  // TODO: wire up MediaRecorder here
  console.log("Start/stop recording…")
  }

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")

    // Call Bedrock API
    setTimeout(async () => {
      try {
        const res = await fetch("/api/bedrock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: input }),
        });

        const data = await res.json();

        const aiMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: res.ok ? data.response : "Error: " + data.error,
        }

        setMessages((prev) => [...prev, aiMessage])
      } catch (err) {
        const errorMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: "Failed to fetch response.",
        }
        setMessages((prev) => [...prev, errorMessage])
      }
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
        <Button
          type="button"
          //variant="ghost"
          size="icon"
          aria-label="Attach photo or video"
          onClick={handlePickMedia}
          disabled={loading}
          className="bg-muted text-muted-foreground hover:bg-muted/80"
        >
          <Camera className="h-5 w-5" />
        </Button>

        <div className = "relative flex-1">
          <Input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            className="pr-12"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Record voice message"
            onClick={handleRecordVoice}
            disabled={loading}
            className="absolute right-1 top-1/2 -translate-y-1/2
                 h-8 w-8"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>


        <Button size="icon" onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>

        
        

      </div>
    </Card>
  )
}
