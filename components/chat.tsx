"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Send, Loader2, Mic, Camera, Square, ChevronDown } from "lucide-react"

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
  const [recording, setRecording] = React.useState(false)
  const [transcribing, setTranscribing] = React.useState(false)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])
  const [userScrolled, setUserScrolled] = React.useState(false)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)
  
  const handlePickMedia =() => fileInputRef.current?.click()
  const handleRecordVoice = async () => {
    if (!recording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          await transcribeAudio(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setRecording(false);
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.transcription) {
        setInput(data.transcription);
      } else {
        console.error('Transcription failed:', data.error);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
    } finally {
      setTranscribing(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, newMessage])
    const currentInput = input
    setInput("")
    setLoading(true)

    setTimeout(async () => {
      try {
        const res = await fetch("/api/bedrock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: currentInput, language }),
        });

        const data = await res.json()

        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, role: "assistant", content: data.response },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 2, role: "assistant", content: "Error: " + data.error },
          ]);
        }
      } catch (err) {
        // Handle network or unexpected error
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 3,
            role: "assistant",
            content: "Failed to fetch response.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }, 800);
  }

  const handleLanguageChange = (newLang: keyof typeof languages) => {
    setLanguage(newLang)
    setShowDropdown(false)
    // Update greeting message
    setMessages([{ id: 1, role: "assistant", content: languages[newLang].greeting }])
  }

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10
      setUserScrolled(!isAtBottom)
    }
  }

  React.useEffect(() => {
    if (!loading && !userScrolled) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, loading, userScrolled])

  React.useEffect(() => {
    setUserScrolled(false)
  }, [loading])

  return (
    <Card className="w-full h-full flex flex-col shadow-md rounded-2xl">
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
      <CardContent 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3 p-4"
      >
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

        {recording && (
          <div className="px-3 py-2 rounded-lg text-sm max-w-[80%] bg-red-100 border border-red-200 inline-flex items-center gap-2">
            <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-700 font-medium">Recording... Tap mic to stop</span>
          </div>
        )}

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
            placeholder={transcribing ? "Transcribing..." : languages[language].placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={loading || transcribing}
            className="pr-12"
          />
          
          {transcribing && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Transcribing.......</span>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Record voice message"
            onClick={handleRecordVoice}
            disabled={loading}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          >
            {recording ? (
              <Square className="h-5 w-5 text-red-500" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          {recording && (
            <span className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500/70 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-red-500 relative" />
            </span>
          )}
        </div>

        <Button size="icon" onClick={handleSend} disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}