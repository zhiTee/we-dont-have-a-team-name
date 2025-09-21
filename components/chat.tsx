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
  const [loading, setLoading] = React.useState(false)
  const [recording, setRecording] = React.useState(false)
  const [transcribing, setTranscribing] = React.useState(false)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])

  const scrollRef = React.useRef<HTMLDivElement>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)
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
          body: JSON.stringify({ message: input }),
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
            placeholder={transcribing ? "Transcribing..." : "Type a message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
            disabled={loading || transcribing}
            className="absolute right-1 top-1/2 -translate-y-1/2
                 h-8 w-8"
          >
            <Mic className={`h-5 w-5 ${recording ? 'text-red-500' : ''}`} />
          </Button>
        </div>


        <Button size="icon" onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>        

      </div>
    </Card>
  )
}
