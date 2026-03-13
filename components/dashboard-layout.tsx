"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
}

interface DashboardLayoutProps {
  children: React.ReactNode
  role: string
  sidebarItems?: SidebarItem[]
  activeSection?: string
  onSectionChange?: (sectionId: string) => void
}

export function DashboardLayout({
  children,
  role,
  sidebarItems,
  activeSection,
  onSectionChange,
}: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (parsedUser.role !== role) {
        router.push("/")
      }
      const notifData = localStorage.getItem("notifications")
      if (notifData) {
        const notifs = JSON.parse(notifData)
        setNotifications(notifs.filter((n: any) => !n.read).length)
      }
    } else {
      router.push("/")
    }
  }, [role, router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) return null

  const roleLabels: Record<string, string> = {
    student: "Student Portal",
    teacher: "Teacher Dashboard",
    authority: "Principal Dashboard",
  }

  const roleColors: Record<string, string> = {
    authority: "bg-[oklch(0.45_0.15_160)]",
    teacher: "bg-[oklch(0.55_0.18_240)]",
    student: "bg-[oklch(0.45_0.15_160)]",
  }

  const handleNavClick = (id: string) => {
    onSectionChange?.(id)
    setMobileSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      {sidebarItems && sidebarItems.length > 0 && (
        <>
          {/* Mobile overlay */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar panel */}
          <aside
            className={cn(
              "fixed top-0 left-0 z-50 h-full flex flex-col border-r bg-card transition-all duration-300",
              sidebarOpen ? "w-64" : "w-[68px]",
              mobileSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            )}
          >
            {/* Sidebar header */}
            <div className="flex h-16 items-center gap-3 border-b px-4">
              <div
                className={cn(
                  "h-9 w-9 shrink-0 rounded-lg flex items-center justify-center",
                  roleColors[role] || "bg-primary"
                )}
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              {sidebarOpen && (
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-semibold truncate">
                    {roleLabels[role]}
                  </h1>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.fullName || user.name}
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex shrink-0 h-8 w-8"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    sidebarOpen && "rotate-180"
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0 h-8 w-8"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="shrink-0 flex items-center justify-center w-5 h-5">
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left truncate">
                        {item.label}
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant={
                            activeSection === item.id ? "secondary" : "default"
                          }
                          className="h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {!sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                    <Badge className="absolute left-11 h-4 min-w-[16px] px-1 text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>

            {/* Sidebar footer */}
            <div className="border-t p-3">
              <button
                onClick={handleLogout}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          sidebarItems && sidebarItems.length > 0
            ? sidebarOpen
              ? "md:ml-64"
              : "md:ml-[68px]"
            : ""
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-14 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              {sidebarItems && sidebarItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              {!sidebarItems && (
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center",
                      roleColors[role] || "bg-primary"
                    )}
                  >
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold">
                      {roleLabels[role]}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      {user.fullName || user.name}
                    </p>
                  </div>
                </div>
              )}
              {sidebarItems && activeSection && (
                <h2 className="text-sm font-semibold text-foreground hidden md:block">
                  {sidebarItems.find((i) => i.id === activeSection)?.label}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                    {notifications}
                  </Badge>
                )}
              </Button>
              {!sidebarItems && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
