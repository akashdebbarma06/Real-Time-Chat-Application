"use client";

import { useState } from "react";
import { Bot, Loader2, Send, Sparkles, User, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIMessage {
  sender: "user" | "ai";
  text: string;
}

interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAssistantDialog({ open, onOpenChange }: AIAssistantDialogProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      sender: "ai",
      text: "Hello! I am your Aether Chat AI Assistant 🤖✨. How can I help you write messages, summarize conversations, or generate ideas today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);

    setTimeout(() => {
      let aiResponse = "I'm here to help! Feel free to ask me to draft a message, proofread text, or summarize notes.";
      const lower = userMsg.toLowerCase();

      if (lower.includes("hello") || lower.includes("hi")) {
        aiResponse = "Hello! 👋 Great to chat with you. What would you like to work on today?";
      } else if (lower.includes("summarize") || lower.includes("summary")) {
        aiResponse = "Here is a quick summary: Key points include meeting notes, task timelines, and upcoming feature releases!";
      } else if (lower.includes("draft") || lower.includes("email") || lower.includes("message")) {
        aiResponse = `Here's a draft for you:\n\n"Hi there! Just following up on our conversation earlier. Let me know when you have a moment to catch up."`;
      }

      setMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);
      setLoading(false);
    }, 800);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden rounded-3xl shadow-2xl flex flex-col h-[520px]">
        <DialogHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Bot className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
                <span>Aether Chat AI Assistant</span>
                <Sparkles className="size-3.5 text-cyan-400" />
              </DialogTitle>
              <p className="text-[10px] text-slate-400">Powered by Gemini AI</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.map((m, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "ai" && (
                  <Avatar className="size-7 border border-slate-700 bg-cyan-500/10 text-cyan-400">
                    <AvatarFallback><Bot className="size-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-cyan-500 text-slate-950 font-medium rounded-br-sm"
                      : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
                {m.sender === "user" && (
                  <Avatar className="size-7 border border-slate-700 bg-slate-800 text-slate-300">
                    <AvatarFallback><User className="size-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="size-4 animate-spin text-cyan-400" />
                <span>AI is thinking...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-slate-800 p-3 bg-slate-950 flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask AI anything..."
            className="h-10 border-slate-800 bg-slate-900 text-slate-100 text-xs rounded-full"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="size-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
