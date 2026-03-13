"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/db"

interface SchoolRegistrationProps {
  onComplete: () => void
}

export function SchoolRegistration({ onComplete }: SchoolRegistrationProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [schoolType, setSchoolType] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target as HTMLFormElement)

    const schoolData = {
      name: formData.get("schoolName") as string,
      type: schoolType,
      location: formData.get("location") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      principalName: formData.get("principalName") as string,
    }

    if (!schoolType) {
      toast({
        title: "Validation Error",
        description: "Please select a school type",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Generate principal credentials client-side
      const principalId = "PRIN" + Math.floor(10000 + Math.random() * 90000).toString()
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
      const principalPassword = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")

      const schoolWithDetails = {
        ...schoolData,
        principalId,
        principalPassword,
        registeredAt: new Date().toISOString(),
        id: Date.now().toString(),
      }

      // Save school to localStorage
      await db.saveSchool(schoolWithDetails)

      // Also keep 'school' as the currently logged in school for convenience
      localStorage.setItem("school", JSON.stringify(schoolWithDetails))

      // Auto-login principal
      const principalUser = {
        id: schoolWithDetails.principalId,
        fullName: schoolWithDetails.principalName,
        generatedId: schoolWithDetails.principalId,
        password: schoolWithDetails.principalPassword,
        role: "authority",
        status: "approved",
        email: schoolWithDetails.email,
        schoolId: schoolWithDetails.id,
      }

      await db.insert("users", principalUser, "registrations")
      localStorage.setItem("user", JSON.stringify(principalUser))

      toast({
        title: "School Registered Successfully!",
        description: `Your credentials have been generated. Please save them securely.`,
      })

      alert(
        `School registered successfully!\n\nPrincipal Login Credentials:\nUser ID: ${schoolWithDetails.principalId}\nPassword: ${schoolWithDetails.principalPassword}\n\nPlease save these credentials securely.\n\nYou will now be redirected to the Principal's Portal.`,
      )

      onComplete()
      router.push("/authority")
    } catch (error) {
      console.error("[v0] Registration error:", error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-semibold">Register Your School</CardTitle>
        <CardDescription>Welcome! Please register your school to get started with the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">School Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input id="schoolName" name="schoolName" placeholder="e.g., St. John's High School" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolType">School Type *</Label>
                <Select name="schoolType" value={schoolType} onValueChange={setSchoolType} required>
                  <SelectTrigger id="schoolType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="government-assisted">Government Assisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">City/Town *</Label>
                <Input id="location" name="location" placeholder="e.g., Freetown" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">School Phone *</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+232 XX XXX XXXX" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter complete school address"
                className="min-h-[80px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">School Email *</Label>
              <Input id="email" name="email" type="email" placeholder="contact@school.edu.sl" required />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">Principal Information</h3>
            <div className="space-y-2">
              <Label htmlFor="principalName">Principal's Full Name *</Label>
              <Input id="principalName" name="principalName" placeholder="Enter principal's full name" required />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> After registration, a unique Principal ID and password will be automatically
                generated. An admission letter will be sent to your email and SMS to your phone. You will have immediate
                access to the Principal's Portal to start registering students and teachers.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register School & Access Portal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
