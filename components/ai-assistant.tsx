"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Send, X, MessageSquare, Bot, User, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { processAIQuery } from "@/lib/ai-engine"
import { Badge } from "@/components/ui/badge"

interface Message {
    id: string
    role: "assistant" | "user"
    content: string
    timestamp: Date
}

interface AIAssistantProps {
    userRole: string
    context?: any
}

export function AIAssistant({ userRole, context }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: `Hello! I am your AI Academic Assistant. I can help you with ${userRole === 'authority' ? 'management, registration, and reports' : userRole === 'teacher' ? 'grading, lesson planning, and student monitoring' : 'study tips, grades, and materials'}. How can I assist you today?`,
            timestamp: new Date()
        }
    ])
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isTyping])

    const handleSend = () => {
        if (!input.trim()) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsTyping(true)

        // Simulate AI thinking
        setTimeout(() => {
            const aiResponse = processAIQuery(input, userRole, context)
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantMsg])
            setIsTyping(false)
        }, 800)
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl animate-bounce hover:animate-none z-50 bg-primary"
            >
                <Sparkles className="h-6 w-6" />
            </Button>
        )
    }

    return (
        <Card className={`fixed bottom-6 right-6 w-[350px] shadow-2xl z-50 transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[500px] flex flex-col'}`}>
            <CardHeader className="bg-primary text-primary-foreground p-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Academic Assistant
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsMinimized(!isMinimized)}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            {!isMinimized && (
                <>
                    <CardContent className="flex-1 p-0 overflow-hidden bg-muted/30">
                        <ScrollArea className="h-full p-4" viewportRef={scrollRef}>
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                            <div className={`h-7 w-7 rounded-sm flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted-foreground text-white"}`}>
                                                {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                            </div>
                                            <div className={`p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"}`}>
                                                {msg.content}
                                                <div className="text-[10px] mt-1 opacity-50 block text-right">
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex items-start gap-2 max-w-[85%]">
                                            <div className="h-7 w-7 rounded-sm flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                                                <Bot className="h-4 w-4" />
                                            </div>
                                            <div className="bg-card border p-3 rounded-lg rounded-tl-none">
                                                <div className="flex gap-1">
                                                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" />
                                                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                                                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-3 bg-card border-t">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex w-full items-center gap-2">
                            <Input
                                placeholder="Ask me anything..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={!input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </>
            )}
        </Card>
    )
}
