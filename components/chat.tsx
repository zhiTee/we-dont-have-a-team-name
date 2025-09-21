"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { Send, ChevronDown, Loader2, Mic, Camera } from "lucide-react"

type Message = {
  id: number
  role: "user" | "assistant"
  content: string
}

const languages = {
  en: { name: "English", placeholder: "Type a message...", greeting: "Hello! How can I help you today?" },
  ms: { name: "Bahasa Malaysia", placeholder: "Taip mesej...", greeting: "Halo! Bagaimana saya boleh membantu anda hari ini?" },
  zh: { name: "中文", placeholder: "输入消息...", greeting: "您好！今天我可以为您做些什么？" }
}

export default function Chat() {
  const [language, setLanguage] = React.useState<keyof typeof languages>("en")
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    { id: 1, role: "assistant", content: languages.en.greeting },
  ])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)


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
    setLoading(true)

    // Call Bedrock API
    setTimeout(async () => {
      try {
        const res = await fetch("/api/bedrock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: input, language }),
        });

        const data = await res.json();

        const aiMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: res.ok ? (data.htmlResponse || data.response) : "Error: " + data.error,
        }

        setMessages((prev) => [...prev, aiMessage])
      } catch (err) {
        const errorMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: "Failed to fetch response.",
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setLoading(false)
      }
    }, 800)
  }

  const handleLanguageChange = (newLang: keyof typeof languages) => {
    setLanguage(newLang)
    setShowDropdown(false)
    // Update greeting message
    setMessages([{ id: 1, role: "assistant", content: languages[newLang].greeting }])
  }

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className="w-full max-w-lg mx-auto h-[600px] flex flex-col shadow-md rounded-2xl">
      {/* Language Selector */}
      <div className="flex justify-end p-3 border-b relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {languages[language].name}
          <ChevronDown className="h-3 w-3" />
        </button>
        {showDropdown && (
          <div className="absolute top-12 right-3 bg-white border rounded-lg shadow-lg z-10 min-w-[140px]">
            {Object.entries(languages).map(([key, lang]) => (
              <button
                key={key}
                onClick={() => handleLanguageChange(key as keyof typeof languages)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
              >
                {lang.name}
              </button>
            ))}
          </div>
        )}
      </div>
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
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: msg.content }} 
            />
          </div>
        ))}

        {loading && (
          <div className="px-3 py-2 rounded-lg text-sm max-w-[80%] bg-muted inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            Thinking...
          </div>
        )}

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

        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={languages[language].placeholder}
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
        <Button size="icon" onClick={handleSend} disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
