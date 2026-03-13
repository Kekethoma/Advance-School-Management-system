"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, Send, ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default function ComplaintBotPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "",
    description: "",
  })
  const [aiSuggestion, setAiSuggestion] = useState("")

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      setUser(userData)
    }
  }, [])

  if (!mounted) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (typeof window !== "undefined") {
      const complaint = {
        id: Date.now().toString(),
        name: user?.name || user?.fullName,
        email: user?.email,
        role: user?.role,
        subject: formData.subject,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        date: new Date().toISOString(),
        status: "pending",
        schoolId: user?.schoolId,
      }

      await db.insert("complaints", complaint, "complaints")

      alert("Your complaint has been submitted successfully. The principal will review it.")
      router.back()
    }
  }

  const handleDescriptionChange = (value: string) => {
    setFormData({ ...formData, description: value })

    // Simple AI-like suggestion based on keywords
    if (value.length > 20) {
      if (value.toLowerCase().includes("grade") || value.toLowerCase().includes("exam")) {
        setAiSuggestion("💡 Tip: Include specific details like the subject, date, and what you expected.")
      } else if (value.toLowerCase().includes("teacher") || value.toLowerCase().includes("staff")) {
        setAiSuggestion("💡 Tip: Be respectful and focus on specific incidents with dates and times.")
      } else if (value.toLowerCase().includes("bully") || value.toLowerCase().includes("harass")) {
        setAiSuggestion(
          "💡 Important: This seems serious. Consider also speaking with a counselor. Include all relevant details.",
        )
      } else if (value.toLowerCase().includes("facility") || value.toLowerCase().includes("classroom")) {
        setAiSuggestion("💡 Tip: Describe the location and specific issue clearly.")
      } else {
        setAiSuggestion("💡 Tip: Be specific and include relevant dates, names, and details.")
      }
    } else {
      setAiSuggestion("")
    }
  }

  const role = user?.role || "student"

  return (
    <DashboardLayout role={role}>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>AI Complaint Assistant</CardTitle>
                <CardDescription>
                  Submit your concerns and complaints. Only the principal can view these.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Complaint Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief summary of your complaint"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic Issues</SelectItem>
                      <SelectItem value="teacher">Teacher Conduct</SelectItem>
                      <SelectItem value="facility">Facility Problems</SelectItem>
                      <SelectItem value="bullying">Bullying/Harassment</SelectItem>
                      <SelectItem value="grading">Grading Concerns</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    required
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of your complaint. Include relevant dates, names, and specific incidents."
                  value={formData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  className="min-h-[200px]"
                  required
                />
              </div>

              {aiSuggestion && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-primary">{aiSuggestion}</p>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium mb-1">Privacy Notice:</p>
                <p>
                  Your complaint will be reviewed confidentially by the principal only. Your identity will be protected.
                </p>
              </div>

              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Submit Complaint
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
