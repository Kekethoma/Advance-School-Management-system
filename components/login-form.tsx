"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { db } from "@/lib/db"

export function LoginForm() {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Try to find the user (Principal, Teacher, or Student)
    const user = await db.findUser(userId, userId) // userId can be either generatedId or email (fallback)

    if (user && user.password === password) {
      if (user.status === "pending") {
        alert("Your account is pending approval by the principal. Please wait for approval before logging in.")
        return
      }
      if (user.status === "rejected") {
        alert("Your account registration was rejected. Please contact the school administration.")
        return
      }

      // Fetch school context
      const school = await db.getSchool(user.schoolId)
      if (school) {
        localStorage.setItem("school", JSON.stringify(school))
      }

      localStorage.setItem("user", JSON.stringify(user))
      router.push(`/${user.role === "authority" ? "authority" : user.role}`)
      return
    }

    alert("Invalid credentials. Please check your ID/Email and password.")
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-semibold">School Management System</CardTitle>
        <CardDescription>Sign in to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="text"
              placeholder="Enter your ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Students and teachers receive credentials from the principal
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
