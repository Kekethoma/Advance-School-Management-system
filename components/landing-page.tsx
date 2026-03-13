"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GraduationCap, BookOpen, Users, Award, Moon, Sun } from "lucide-react"
import { SchoolRegistration } from "@/components/school-registration"
import { LoginForm } from "@/components/login-form"
import { useTheme } from "@/components/theme-provider"

interface Quote {
  text: string
  author: string
}

export function LandingPage() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginRole, setLoginRole] = useState<"student" | "teacher" | "admin">("student")
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchQuote()
  }, [])

  const fetchQuote = async () => {
    try {
      const response = await fetch("/api/quotes/random")
      const data = await response.json()
      setQuote(data)
    } catch (error) {
      // Fallback quote
      setQuote({
        text: "Education is the most powerful weapon which you can use to change the world.",
        author: "Nelson Mandela",
      })
    }
  }

  if (showRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Button variant="ghost" onClick={() => setShowRegistration(false)} className="mb-4">
            ← Back to Home
          </Button>
          <SchoolRegistration onComplete={() => setShowRegistration(false)} />
        </motion.div>
      </div>
    )
  }

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Button variant="ghost" onClick={() => setShowLogin(false)} className="mb-4">
            ← Back to Home
          </Button>
          <LoginForm />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Theme Toggle */}
      {mounted && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <GraduationCap className="h-12 w-12 text-primary-foreground" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent leading-tight"
          >
            School Management System
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Empowering Education in Sierra Leone
          </motion.p>

          {/* Quote Section */}
          {quote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-12 p-8 rounded-2xl bg-card border border-border shadow-lg max-w-3xl mx-auto"
            >
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-4" />
              <p className="text-lg md:text-xl italic text-foreground mb-4 leading-relaxed text-balance">
                "{quote.text}"
              </p>
              <p className="text-muted-foreground font-semibold">— {quote.author}</p>
            </motion.div>
          )}

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Button size="lg" onClick={() => setShowRegistration(true)} className="w-full sm:w-auto text-lg px-8 py-6">
              <GraduationCap className="mr-2 h-5 w-5" />
              Register Your School
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setLoginRole("student")
                setShowLogin(true)
              }}
              className="w-full sm:w-auto text-lg px-8 py-6"
            >
              <Users className="mr-2 h-5 w-5" />
              Student/Teacher Login
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                setLoginRole("admin")
                setShowLogin(true)
              }}
              className="w-full sm:w-auto text-lg px-8 py-6"
            >
              <Award className="mr-2 h-5 w-5" />
              Principal Login
            </Button>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {[
              {
                icon: Users,
                title: "Student Management",
                description: "Comprehensive student records, grades, and progress tracking",
              },
              {
                icon: BookOpen,
                title: "Learning Materials",
                description: "Digital library for course materials and resources",
              },
              {
                icon: Award,
                title: "Performance Analytics",
                description: "Real-time insights into academic performance",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-10 w-10 text-primary mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
