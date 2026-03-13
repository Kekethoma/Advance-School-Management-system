"use client"

import type React from "react"
import { DashboardLayout, type SidebarItem } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CheckCircle, XCircle, FileText, ClipboardList, AlertCircle, BarChart3,
  UserCheck, Megaphone, MessageSquare, UserPlus, Mail, School, MapPin,
  Phone, Users, BookOpen, ShieldCheck, LayoutDashboard, Settings,
  Download, Calendar, ToggleLeft, ToggleRight, Printer, Lock, Unlock,
  AlertTriangle, Clock, Sparkles, TrendingUp,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  STUDENT_LEVELS, getSubjectsForStudent, JSS_SUBJECTS, ARTS_SUBJECTS,
} from "@/lib/subjects-data"
import { getAcademicAdvice } from "@/lib/ai-engine"
import { Checkbox } from "@/components/ui/checkbox"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { AIAssistant } from "@/components/ai-assistant"
import { db } from "@/lib/db"

const ACADEMIC_YEARS = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"]
const TERMS = ["First Term", "Second Term", "Third Term"]
const QUALIFICATIONS = ["Certificate", "Diploma", "HTC", "Bachelor's Degree", "Master's Degree", "PhD"]

function generateCSV(headers: string[], rows: string[][]): string {
  const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","))].join("\n")
  return csvContent
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function AuthorityDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [complaints, setComplaints] = useState<any[]>([])
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, students: 0, teachers: 0 })
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")

  // State for Class Records Feature
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>("JSS 1")
  const [selectedClassDepartment, setSelectedClassDepartment] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
  const [teacherAssignments, setTeacherAssignments] = useState<{ classes: string[]; subjects: string[] }>({ classes: [], subjects: [] })
  const [teacherSpecialRole, setTeacherSpecialRole] = useState<string>("Standard")
  const [teacherMasterClass, setTeacherMasterClass] = useState<string>("")
  const [lastRegisteredUser, setLastRegisteredUser] = useState<any>(null)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)

  // Settings state
  const [academicYear, setAcademicYear] = useState("2024/2025")
  const [currentTerm, setCurrentTerm] = useState("First Term")
  const [gradeSubmissionOpen, setGradeSubmissionOpen] = useState(true)
  const [materialSubmissionOpen, setMaterialSubmissionOpen] = useState(true)
  const [studentRegistrationOpen, setStudentRegistrationOpen] = useState(true)
  const [teacherRegistrationOpen, setTeacherRegistrationOpen] = useState(true)
  const [settingsLastSaved, setSettingsLastSaved] = useState<string>("")
  const [showSettingsConfirmDialog, setShowSettingsConfirmDialog] = useState(false)
  const [pendingSettingsChange, setPendingSettingsChange] = useState<{ field: string; value: string } | null>(null)
  const [academicTips, setAcademicTips] = useState<string[]>([])

  // Report filters
  const [reportType, setReportType] = useState("students")
  const [reportFilterLevel, setReportFilterLevel] = useState("all")
  const [reportFilterGender, setReportFilterGender] = useState("all")
  const [reportFilterDepartment, setReportFilterDepartment] = useState("all")
  const [reportFilterYear, setReportFilterYear] = useState("all")
  const [reportFilterTerm, setReportFilterTerm] = useState("all")
  const [reportFilterQualification, setReportFilterQualification] = useState("all")
  const [reportFilterRoll, setReportFilterRoll] = useState("")

  const CHART_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"]

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadData = async () => {
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      const schoolId = userData.schoolId

      const registrations = await db.fetch<any>("users", schoolId, "registrations")
      setRegisteredUsers(registrations)

      const storedComplaints = await db.fetch<any>("complaints", schoolId, "complaints")
      setComplaints(storedComplaints)

      const approvals = await db.fetch<any>("approvals", schoolId, "approvals")
      setPendingApprovals(approvals)

      setStats({
        pending: approvals.filter((a: any) => a.status === "pending").length,
        approved: approvals.filter((a: any) => a.status === "approved").length,
        rejected: approvals.filter((a: any) => a.status === "rejected").length,
        students: registrations.filter((r: any) => r.role === "student").length,
        teachers: registrations.filter((r: any) => r.role === "teacher").length,
      })

      const schoolData = JSON.parse(localStorage.getItem("school") || "{}")
      setSchool(schoolData)

      // Load settings - unique per schoolId
      const savedSettings = JSON.parse(localStorage.getItem(`schoolSettings_${schoolId}`) || "{}")
      if (savedSettings.academicYear) setAcademicYear(savedSettings.academicYear)
      if (savedSettings.currentTerm) setCurrentTerm(savedSettings.currentTerm)
      if (savedSettings.gradeSubmissionOpen !== undefined) setGradeSubmissionOpen(savedSettings.gradeSubmissionOpen)
      if (savedSettings.materialSubmissionOpen !== undefined) setMaterialSubmissionOpen(savedSettings.materialSubmissionOpen)
      if (savedSettings.studentRegistrationOpen !== undefined) setStudentRegistrationOpen(savedSettings.studentRegistrationOpen)
      if (savedSettings.teacherRegistrationOpen !== undefined) setTeacherRegistrationOpen(savedSettings.teacherRegistrationOpen)
      if (savedSettings.lastSaved) setSettingsLastSaved(savedSettings.lastSaved)

      setAcademicTips(getAcademicAdvice("authority"))
      setIsLoaded(true)
    }

    loadData()
  }, [])

  useEffect(() => {
    if (selectedRole === "student" && selectedLevel) {
      const subjects = getSubjectsForStudent(selectedLevel, selectedDepartment)
      setAvailableSubjects(subjects)
      setSelectedSubjects(subjects.map((s) => s.id))
    }
  }, [selectedLevel, selectedDepartment, selectedRole])

  const generateId = (role: string) => {
    const schoolInitial = school?.name ? school.name.charAt(0).toUpperCase() : ""
    const prefix = role === "student" ? "S" : "T"
    const random = Math.floor(1000 + Math.random() * 9000).toString()
    return `${schoolInitial}${prefix}${random}`
  }

  const generateRollNumber = (level: string) => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}")
    const schoolId = userData.schoolId
    const allRegistrations = JSON.parse(localStorage.getItem("registrations") || "[]")
    const studentsInLevel = allRegistrations.filter((r: any) => r.schoolId === schoolId && r.role === "student" && r.level === level && r.academicYear === academicYear)
    const seq = (studentsInLevel.length + 1).toString().padStart(3, "0")
    const classCode = level.replace(/\s+/g, "")
    const yearPart = academicYear.split("/")[0]
    return `${classCode}/${seq}/${yearPart}`
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
    let password = ""
    for (let i = 0; i < 6; i++) password += chars.charAt(Math.floor(Math.random() * chars.length))
    return password
  }

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const generatedId = generateId(selectedRole)
    const generatedPassword = generatePassword()
    const userData = JSON.parse(localStorage.getItem("user") || "{}")
    const newUser: any = {
      id: Date.now().toString(), fullName: formData.get("fullName"), email: formData.get("email"),
      phone: formData.get("phone"), role: selectedRole, generatedId, password: generatedPassword,
      status: "approved", createdAt: new Date().toISOString(),
      academicYear, term: currentTerm, schoolId: userData.schoolId,
      gender: formData.get("gender") || "",
    }
    if (selectedRole === "student") {
      newUser.level = selectedLevel
      newUser.department = selectedDepartment || null
      newUser.subjects = selectedSubjects
      newUser.guardianName = formData.get("guardianName") || ""
      newUser.guardianPhone = formData.get("guardianPhone") || ""
      newUser.dateOfBirth = formData.get("dateOfBirth") || ""
      newUser.rollNumber = generateRollNumber(selectedLevel)
    }
    if (selectedRole === "teacher") {
      newUser.department = formData.get("teacherDepartment")
      newUser.assignedClasses = teacherAssignments.classes
      newUser.assignedSubjects = teacherAssignments.subjects
      newUser.qualification = formData.get("qualification") || ""
      newUser.specialRole = teacherSpecialRole
      if (teacherSpecialRole === "Class Master") {
        newUser.masterClass = teacherMasterClass
      }
    }

    await db.insert("users", newUser, "registrations")

    const schoolRegistrations = [...registeredUsers, newUser]
    setRegisteredUsers(schoolRegistrations)

    setStats((prev) => ({
      ...prev,
      students: schoolRegistrations.filter((r: any) => r.role === "student").length,
      teachers: schoolRegistrations.filter((r: any) => r.role === "teacher").length,
    }))
    setLastRegisteredUser(newUser)
    setShowCredentialsDialog(true)
    setSelectedRole(""); setSelectedLevel(""); setSelectedDepartment(""); setSelectedSubjects([]);
    setTeacherAssignments({ classes: [], subjects: [] })
    setTeacherSpecialRole("Standard"); setTeacherMasterClass("")
      ; (e.target as HTMLFormElement).reset()
  }

  const downloadCredentials = (user: any) => {
    const schoolName = school?.name || "School Management System"
    const content = `
========================================
${schoolName}
OFFICIAL CREDENTIALS LETTER
========================================

Date: ${new Date().toLocaleDateString()}
Academic Year: ${user.academicYear || academicYear}
Term: ${user.term || currentTerm}

Dear ${user.fullName},

Congratulations! You have been successfully registered as a ${user.role === "student" ? "Student" : "Teacher"} at ${schoolName}.

YOUR LOGIN CREDENTIALS
-----------------------
User ID: ${user.generatedId}
Password: ${user.password}

${user.role === "student" ? `ACADEMIC INFORMATION
-----------------------
Class Level: ${user.level}
${user.department ? `Department: ${user.department}` : ""}
Gender: ${user.gender || "N/A"}
Guardian: ${user.guardianName || "N/A"}
` : `PROFESSIONAL INFORMATION
-----------------------
Department: ${user.department}
Qualification: ${user.qualification || "N/A"}
Gender: ${user.gender || "N/A"}
Assigned Classes: ${user.assignedClasses?.join(", ") || "N/A"}
Assigned Subjects: ${user.assignedSubjects?.join(", ") || "N/A"}
`}
IMPORTANT NOTES
-----------------------
1. Please change your password after first login.
2. Keep your credentials safe and do not share them.
3. Contact the principal for any login issues.

Yours faithfully,
The Principal
${schoolName}
========================================
`
    downloadFile(content, `Credentials_${user.generatedId}_${user.fullName.replace(/\s+/g, "_")}.txt`, "text/plain")
  }

  const handleApprove = async (item: any) => {
    await db.update("approvals", item.id, { status: "approved" }, "approvals")

    const schoolApprovals = pendingApprovals.map((p: any) => (p.id === item.id ? { ...p, status: "approved" } : p))
    setPendingApprovals(schoolApprovals)
    setStats((prev) => ({
      ...prev,
      pending: schoolApprovals.filter((a: any) => a.status === "pending").length,
      approved: schoolApprovals.filter((a: any) => a.status === "approved").length,
      rejected: schoolApprovals.filter((a: any) => a.status === "rejected").length,
    }))
    alert(`${item.type === "material" ? "Material" : "Grade"} approved successfully!`)
  }

  const handleReject = (item: any) => { setSelectedItem(item); setShowRejectDialog(true) }

  const confirmReject = async () => {
    if (selectedItem) {
      await db.update("approvals", selectedItem.id, { status: "rejected" }, "approvals")

      const schoolApprovals = pendingApprovals.map((p: any) => (p.id === selectedItem.id ? { ...p, status: "rejected" } : p))
      setPendingApprovals(schoolApprovals)
      setStats((prev) => ({
        ...prev,
        pending: schoolApprovals.filter((a: any) => a.status === "pending").length,
        approved: schoolApprovals.filter((a: any) => a.status === "approved").length,
        rejected: schoolApprovals.filter((a: any) => a.status === "rejected").length,
      }))
      setShowRejectDialog(false)
      alert(`${selectedItem.type === "material" ? "Material" : "Grade"} rejected.`)
    }
  }

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const newAnnouncement = {
      id: Date.now().toString(),
      title: formData.get("title")?.toString(),
      content: formData.get("content")?.toString(),
      postedBy: user.fullName || "Principal",
      date: new Date().toLocaleDateString(),
      comments: [],
      schoolId: user.schoolId
    }

    await db.insert("announcements", newAnnouncement, "announcements")

    alert("Announcement posted successfully!")
      ; (e.target as HTMLFormElement).reset()
  }

  const saveSettings = () => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}")
    const schoolId = userData.schoolId
    const settings = { academicYear, currentTerm, gradeSubmissionOpen, materialSubmissionOpen, studentRegistrationOpen, teacherRegistrationOpen, lastSaved: new Date().toLocaleTimeString() }
    localStorage.setItem(`schoolSettings_${schoolId}`, JSON.stringify(settings))
    setSettingsLastSaved(settings.lastSaved)
    alert("Settings saved successfully!")
  }

  const handleSettingsFieldChange = (field: string, value: string) => {
    if (field === "academicYear" || field === "currentTerm") {
      setPendingSettingsChange({ field, value })
      setShowSettingsConfirmDialog(true)
    }
  }

  const confirmSettingsChange = () => {
    if (pendingSettingsChange) {
      if (pendingSettingsChange.field === "academicYear") setAcademicYear(pendingSettingsChange.value)
      if (pendingSettingsChange.field === "currentTerm") setCurrentTerm(pendingSettingsChange.value)
    }
    setShowSettingsConfirmDialog(false)
    setPendingSettingsChange(null)
  }

  const downloadBulkCredentials = (role: string) => {
    const users = registeredUsers.filter((u) => u.role === role)
    if (users.length === 0) { alert(`No ${role}s registered yet.`); return }
    const schoolName = school?.name || "School Management System"
    let content = `${schoolName}\n${"=".repeat(60)}\nBULK CREDENTIALS — ${role === "student" ? "STUDENTS" : "TEACHERS"}\nGenerated: ${new Date().toLocaleString()}\nAcademic Year: ${academicYear} | Term: ${currentTerm}\nTotal: ${users.length}\n${"=".repeat(60)}\n\n`
    users.forEach((u, i) => {
      content += `${i + 1}. ${u.fullName}\n   ID: ${u.generatedId} | Password: ${u.password}\n   Email: ${u.email} | Phone: ${u.phone}\n`
      if (role === "student") content += `   Level: ${u.level || "N/A"} | Roll: ${u.rollNumber || "N/A"} | DOB: ${u.dateOfBirth || "N/A"}\n`
      if (role === "teacher") content += `   Dept: ${u.department || "N/A"} | Qualification: ${u.qualification || "N/A"}\n`
      content += `\n`
    })
    content += `${"=".repeat(60)}\nIMPORTANT: Keep this document secure. Do not share publicly.\n`
    downloadFile(content, `All_${role}_Credentials_${new Date().toISOString().split("T")[0]}.txt`, "text/plain")
  }

  // Report generation
  const getFilteredData = () => {
    let data = reportType === "students"
      ? registeredUsers.filter((u) => u.role === "student")
      : registeredUsers.filter((u) => u.role === "teacher")

    if (reportFilterLevel !== "all") data = data.filter((u) => u.level === reportFilterLevel)
    if (reportFilterGender !== "all") data = data.filter((u) => u.gender === reportFilterGender)
    if (reportFilterDepartment !== "all") data = data.filter((u) => u.department === reportFilterDepartment)
    if (reportFilterYear !== "all") data = data.filter((u) => u.academicYear === reportFilterYear)
    if (reportFilterTerm !== "all") data = data.filter((u) => u.term === reportFilterTerm)
    if (reportType === "teachers" && reportFilterQualification !== "all") data = data.filter((u) => u.qualification === reportFilterQualification)
    if (reportFilterRoll) data = data.filter((u) => u.rollNumber?.toLowerCase().includes(reportFilterRoll.toLowerCase()))

    return data
  }

  const downloadReportCSV = () => {
    const data = getFilteredData()
    if (data.length === 0) { alert("No data matches your filters."); return }
    const headers = reportType === "students"
      ? ["ID", "Full Name", "Email", "Phone", "Gender", "Level", "Department", "Guardian", "Academic Year", "Term", "Registration Date"]
      : ["ID", "Full Name", "Email", "Phone", "Gender", "Department", "Qualification", "Classes", "Subjects", "Academic Year", "Term", "Registration Date"]
    const rows = data.map((u) => reportType === "students"
      ? [u.generatedId, u.fullName, u.email, u.phone, u.gender || "N/A", u.level || "N/A", u.department || "N/A", u.guardianName || "N/A", u.academicYear || "N/A", u.term || "N/A", new Date(u.createdAt).toLocaleDateString()]
      : [u.generatedId, u.fullName, u.email, u.phone, u.gender || "N/A", u.department || "N/A", u.qualification || "N/A", (u.assignedClasses || []).join("; "), (u.assignedSubjects || []).join("; "), u.academicYear || "N/A", u.term || "N/A", new Date(u.createdAt).toLocaleDateString()]
    )
    const csv = generateCSV(headers, rows)
    downloadFile(csv, `${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`, "text/csv")
  }

  const downloadReportPDF = () => {
    const data = getFilteredData()
    if (data.length === 0) { alert("No data matches your filters."); return }
    const schoolName = school?.name || "School Management System"
    let content = `${schoolName}\n${"=".repeat(60)}\n`
    content += `${reportType === "students" ? "STUDENT" : "TEACHER"} REPORT\n`
    content += `Generated: ${new Date().toLocaleString()}\n`
    content += `Academic Year: ${reportFilterYear === "all" ? "All" : reportFilterYear}\n`
    content += `Term: ${reportFilterTerm === "all" ? "All" : reportFilterTerm}\n`
    content += `Total Records: ${data.length}\n${"=".repeat(60)}\n\n`

    if (reportFilterGender !== "all") content += `Gender Filter: ${reportFilterGender}\n`
    if (reportFilterLevel !== "all") content += `Level Filter: ${reportFilterLevel}\n`
    if (reportFilterDepartment !== "all") content += `Department Filter: ${reportFilterDepartment}\n`
    if (reportType === "teachers" && reportFilterQualification !== "all") content += `Qualification Filter: ${reportFilterQualification}\n`
    content += "\n"

    data.forEach((u, i) => {
      content += `${i + 1}. ${u.fullName}\n`
      content += `   ID: ${u.generatedId} | Gender: ${u.gender || "N/A"}\n`
      content += `   Email: ${u.email} | Phone: ${u.phone}\n`
      if (reportType === "students") {
        content += `   Level: ${u.level || "N/A"} | Department: ${u.department || "N/A"}\n`
        content += `   Guardian: ${u.guardianName || "N/A"}\n`
      } else {
        content += `   Department: ${u.department || "N/A"} | Qualification: ${u.qualification || "N/A"}\n`
        content += `   Classes: ${(u.assignedClasses || []).join(", ") || "N/A"}\n`
        content += `   Subjects: ${(u.assignedSubjects || []).join(", ") || "N/A"}\n`
      }
      content += `   Registered: ${new Date(u.createdAt).toLocaleDateString()} | Year: ${u.academicYear || "N/A"} | Term: ${u.term || "N/A"}\n\n`
    })

    // Summary
    content += `\n${"=".repeat(60)}\nSUMMARY\n${"=".repeat(60)}\n`
    if (reportType === "students") {
      const males = data.filter((u) => u.gender === "Male").length
      const females = data.filter((u) => u.gender === "Female").length
      const levels: Record<string, number> = {}
      const depts: Record<string, number> = {}
      data.forEach((u) => { if (u.level) levels[u.level] = (levels[u.level] || 0) + 1; if (u.department) depts[u.department] = (depts[u.department] || 0) + 1 })
      content += `Male: ${males} | Female: ${females} | Other/Unspecified: ${data.length - males - females}\n`
      Object.entries(levels).forEach(([k, v]) => { content += `${k}: ${v} students\n` })
      Object.entries(depts).forEach(([k, v]) => { content += `${k}: ${v} students\n` })
    } else {
      const quals: Record<string, number> = {}
      const depts: Record<string, number> = {}
      data.forEach((u) => { if (u.qualification) quals[u.qualification] = (quals[u.qualification] || 0) + 1; if (u.department) depts[u.department] = (depts[u.department] || 0) + 1 })
      Object.entries(quals).forEach(([k, v]) => { content += `${k}: ${v} teachers\n` })
      Object.entries(depts).forEach(([k, v]) => { content += `${k}: ${v} teachers\n` })
    }

    downloadFile(content, `${reportType}_report_${new Date().toISOString().split("T")[0]}.txt`, "text/plain")
  }

  const pendingItems = pendingApprovals.filter((a) => a.status === "pending")
  const materials = pendingApprovals.filter((a) => a.type === "material" && a.status === "pending")
  const grades = pendingApprovals.filter((a) => a.type === "grade" && a.status === "pending")

  const availableTeacherSubjects = (() => {
    if (selectedRole !== "teacher") return []
    const subjectsMap = new Map<string, any>()
    teacherAssignments.classes.forEach((level) => {
      const levelSubjects = getSubjectsForStudent(level, selectedDepartment)
      levelSubjects.forEach((s) => subjectsMap.set(s.id, s))
    })
    return Array.from(subjectsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  })()

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "students", label: "Students", icon: <Users className="h-5 w-5" />, badge: stats.students },
    { id: "teachers", label: "Teachers", icon: <BookOpen className="h-5 w-5" />, badge: stats.teachers },
    { id: "register", label: "Register Users", icon: <UserPlus className="h-5 w-5" /> },
    { id: "class-records", label: "Class Records", icon: <FileText className="h-5 w-5" /> },
    { id: "grades", label: "Grades", icon: <ClipboardList className="h-5 w-5" />, badge: grades.length },
    { id: "approvals", label: "Approvals", icon: <ShieldCheck className="h-5 w-5" />, badge: pendingItems.length },
    { id: "announcements", label: "Announcements", icon: <Megaphone className="h-5 w-5" /> },
    { id: "complaints", label: "Complaints", icon: <MessageSquare className="h-5 w-5" />, badge: complaints.length },
    { id: "reports", label: "Reports", icon: <BarChart3 className="h-5 w-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ]

  if (!isLoaded) {
    return (
      <DashboardLayout role="authority" sidebarItems={sidebarItems} activeSection={activeSection} onSectionChange={setActiveSection}>
        <div className="flex items-center justify-center py-12"><div className="animate-pulse">Loading dashboard...</div></div>
      </DashboardLayout>
    )
  }

  const studentUsers = registeredUsers.filter((u) => u.role === "student")
  const teacherUsers = registeredUsers.filter((u) => u.role === "teacher")
  const filteredReportData = getFilteredData()

  return (
    <DashboardLayout role="authority" sidebarItems={sidebarItems} activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="space-y-6">
        {/* OVERVIEW */}
        {activeSection === "overview" && (
          <>
            {school && school.name && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><School className="h-5 w-5" />{school.name}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{school.location}</span>
                      <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{school.phone}</span>
                      <span className="capitalize">{school.type} School</span>
                      <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{academicYear} - {currentTerm}</Badge>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.pending}</div><p className="text-xs text-muted-foreground">Requires attention</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.students}</div><p className="text-xs text-muted-foreground">Registered</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                  <BookOpen className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.teachers}</div><p className="text-xs text-muted-foreground">Registered</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Complaints</CardTitle>
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{complaints.length}</div><p className="text-xs text-muted-foreground">Total submissions</p></CardContent>
              </Card>
            </div>

            {academicTips.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI School Performance Analyst
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {academicTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/50">
                        <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">Recent Pending Approvals</CardTitle>
                    <CardDescription>Needing attention</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveSection("approvals")}>View All</Button>
                </CardHeader>
                <CardContent>
                  {pendingItems.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">No pending approvals.</div>
                  ) : (
                    <div className="space-y-4">
                      {pendingItems.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.subject} • By {item.submittedBy}</p>
                          </div>
                          <Badge variant="outline">{item.type}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">Recent Complaints</CardTitle>
                    <CardDescription>Latest feedback</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveSection("complaints")}>View All</Button>
                </CardHeader>
                <CardContent>
                  {complaints.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">No complaints.</div>
                  ) : (
                    <div className="space-y-4">
                      {complaints.slice(0, 4).map((complaint) => (
                        <div key={complaint.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-sm">{complaint.subject}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px]">{complaint.role}</Badge>
                              {complaint.priority && <Badge variant={complaint.priority === "high" || complaint.priority === "urgent" ? "destructive" : "outline"} className="text-[10px]">{complaint.priority}</Badge>}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(complaint.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* STUDENTS */}
        {activeSection === "students" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div><CardTitle>All Students</CardTitle><CardDescription>{studentUsers.length} registered students</CardDescription></div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => downloadBulkCredentials("student")}><Download className="h-4 w-4 mr-2" />All Credentials</Button>
                  <Button variant="outline" size="sm" onClick={() => { setReportType("students"); setActiveSection("reports") }}><BarChart3 className="h-4 w-4 mr-2" />View Report</Button>
                  <Button onClick={() => { setSelectedRole("student"); setActiveSection("register") }}><UserPlus className="h-4 w-4 mr-2" />Register Student</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studentUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No students registered yet.</div>
              ) : (
                <div className="space-y-3">
                  {studentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{user.fullName}</h3>
                          {user.gender && <Badge variant="outline">{user.gender}</Badge>}
                          {user.level && <Badge variant="outline">{user.level}</Badge>}
                          {user.department && <Badge>{user.department}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">ID: {user.generatedId}{user.rollNumber ? ` | Roll: ${user.rollNumber}` : ""} | {user.email} | {user.phone}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.academicYear || "N/A"} | {user.term || "N/A"}{user.subjects ? ` | ${user.subjects.length} subjects` : ""}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => downloadCredentials(user)}><Download className="h-4 w-4 mr-2" />Download</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TEACHERS */}
        {activeSection === "teachers" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div><CardTitle>All Teachers</CardTitle><CardDescription>{teacherUsers.length} registered teachers</CardDescription></div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => downloadBulkCredentials("teacher")}><Download className="h-4 w-4 mr-2" />All Credentials</Button>
                  <Button variant="outline" size="sm" onClick={() => { setReportType("teachers"); setActiveSection("reports") }}><BarChart3 className="h-4 w-4 mr-2" />View Report</Button>
                  <Button onClick={() => { setSelectedRole("teacher"); setActiveSection("register") }}><UserPlus className="h-4 w-4 mr-2" />Register Teacher</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {teacherUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No teachers registered yet.</div>
              ) : (
                <div className="space-y-3">
                  {teacherUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{user.fullName}</h3>
                          {user.gender && <Badge variant="outline">{user.gender}</Badge>}
                          {user.department && <Badge>{user.department}</Badge>}
                          {user.qualification && <Badge variant="secondary">{user.qualification}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">ID: {user.generatedId} | {user.email}</p>
                        {user.assignedClasses && <p className="text-xs text-muted-foreground mt-0.5">Classes: {user.assignedClasses.join(", ")}</p>}
                        {user.assignedSubjects && <p className="text-xs text-muted-foreground mt-0.5">Subjects: {user.assignedSubjects.join(", ")}</p>}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => downloadCredentials(user)}><Download className="h-4 w-4 mr-2" />Download</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* REGISTER USERS */}
        {activeSection === "register" && (
          <Card>
            <CardHeader>
              <CardTitle>Register New Student or Teacher</CardTitle>
              <CardDescription>Academic Year: {academicYear} | {currentTerm} | Sierra Leone Curriculum</CardDescription>
            </CardHeader>
            <CardContent>
              {(selectedRole === "student" && !studentRegistrationOpen) || (selectedRole === "teacher" && !teacherRegistrationOpen) ? (
                <div className="text-center py-12 space-y-3">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="font-semibold text-lg">Registration Closed</h3>
                  <p className="text-muted-foreground">{selectedRole === "student" ? "Student" : "Teacher"} registration is currently closed by the principal. Go to <strong>Settings</strong> to open it.</p>
                  <Button variant="outline" onClick={() => setActiveSection("settings")}><Settings className="h-4 w-4 mr-2" />Go to Settings</Button>
                </div>
              ) : (
                <form onSubmit={handleRegisterUser} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" name="fullName" placeholder="Enter full name" required /></div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select name="role" value={selectedRole} onValueChange={setSelectedRole} required>
                        <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="teacher">Teacher</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" name="email" type="email" placeholder="user@example.com" required /></div>
                    <div className="space-y-2"><Label htmlFor="phone">Phone (WhatsApp)</Label><Input id="phone" name="phone" type="tel" placeholder="+232 XX XXX XXXX" required /></div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select name="gender" required>
                        <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedRole === "student" && (
                    <>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="level">Student Level</Label>
                          <Select value={selectedLevel} onValueChange={(val) => { setSelectedLevel(val); if (val.startsWith("JSS")) setSelectedDepartment("") }} required>
                            <SelectTrigger id="level"><SelectValue placeholder="Select level" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="JSS I">JSS I</SelectItem><SelectItem value="JSS II">JSS II</SelectItem><SelectItem value="JSS III">JSS III</SelectItem>
                              <SelectItem value="SSS I">SSS I</SelectItem><SelectItem value="SSS II">SSS II</SelectItem><SelectItem value="SSS III">SSS III</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedLevel && selectedLevel.startsWith("SSS") && (
                          <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment} required>
                              <SelectTrigger id="department"><SelectValue placeholder="Select department" /></SelectTrigger>
                              <SelectContent><SelectItem value="Arts">Arts</SelectItem><SelectItem value="Science">Science</SelectItem><SelectItem value="Commercial">Commercial</SelectItem></SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2"><Label htmlFor="dateOfBirth">Date of Birth</Label><Input id="dateOfBirth" name="dateOfBirth" type="date" required /></div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="guardianName">Guardian/Parent Name</Label><Input id="guardianName" name="guardianName" placeholder="Guardian full name" /></div>
                        <div className="space-y-2"><Label htmlFor="guardianPhone">Guardian Phone</Label><Input id="guardianPhone" name="guardianPhone" type="tel" placeholder="+232 XX XXX XXXX" /></div>
                      </div>
                      {availableSubjects.length > 0 && (
                        <div className="space-y-2">
                          <Label>Auto-Assigned Subjects</Label>
                          <div className="border rounded-lg p-4 bg-muted/50 max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                              {availableSubjects.map((subject) => (
                                <div key={subject.id} className="flex items-center gap-2">
                                  <Checkbox checked={selectedSubjects.includes(subject.id)} onCheckedChange={(checked) => { if (checked) setSelectedSubjects([...selectedSubjects, subject.id]); else setSelectedSubjects(selectedSubjects.filter((id) => id !== subject.id)) }} />
                                  <span className="text-sm">{subject.name}</span>
                                  {subject.isCore && <Badge variant="outline" className="text-xs">Core</Badge>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedRole === "teacher" && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="teacherDepartment">Department</Label>
                          <Select name="teacherDepartment" value={selectedDepartment} onValueChange={setSelectedDepartment} required>
                            <SelectTrigger id="teacherDepartment"><SelectValue placeholder="Select department" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arts">Arts</SelectItem>
                              <SelectItem value="Science">Science</SelectItem>
                              <SelectItem value="Commercial">Commercial</SelectItem>
                              <SelectItem value="General">General (JSS)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qualification">Qualification</Label>
                          <Select name="qualification" required>
                            <SelectTrigger id="qualification"><SelectValue placeholder="Select qualification" /></SelectTrigger>
                            <SelectContent>{QUALIFICATIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="specialRole">Specialized Role</Label>
                          <Select value={teacherSpecialRole} onValueChange={setTeacherSpecialRole}>
                            <SelectTrigger id="specialRole"><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Standard">Standard Teacher</SelectItem>
                              <SelectItem value="HOD">Head of Department (HOD)</SelectItem>
                              <SelectItem value="Exams Officer">Exams Officer</SelectItem>
                              <SelectItem value="Class Master">Class Master</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {teacherSpecialRole === "Class Master" && (
                          <div className="space-y-2">
                            <Label htmlFor="masterClass">Class to Manage</Label>
                            <Select value={teacherMasterClass} onValueChange={setTeacherMasterClass} required>
                              <SelectTrigger id="masterClass"><SelectValue placeholder="Select class" /></SelectTrigger>
                              <SelectContent>
                                {[...STUDENT_LEVELS.JSS, ...STUDENT_LEVELS.SSS].map((level) => (
                                  <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Assign Classes</Label>
                        <div className="border rounded-lg p-4 bg-muted/50">
                          <div className="grid grid-cols-3 gap-2">
                            {[...STUDENT_LEVELS.JSS, ...STUDENT_LEVELS.SSS].map((level) => (
                              <div key={level} className="flex items-center gap-2">
                                <Checkbox checked={teacherAssignments.classes.includes(level)} onCheckedChange={(checked) => { if (checked) setTeacherAssignments({ ...teacherAssignments, classes: [...teacherAssignments.classes, level] }); else setTeacherAssignments({ ...teacherAssignments, classes: teacherAssignments.classes.filter((c) => c !== level) }) }} />
                                <span className="text-sm">{level}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Assign Subjects</Label>
                        <div className="border rounded-lg p-4 bg-muted/50 max-h-48 overflow-y-auto">
                          {availableTeacherSubjects.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">Select at least one class and department to assign subjects.</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {availableTeacherSubjects.map((subject) => (
                                <div key={subject.id} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={teacherAssignments.subjects.includes(subject.name)}
                                    onCheckedChange={(checked) => {
                                      if (checked) setTeacherAssignments({ ...teacherAssignments, subjects: [...teacherAssignments.subjects, subject.name] });
                                      else setTeacherAssignments({ ...teacherAssignments, subjects: teacherAssignments.subjects.filter((s) => s !== subject.name) })
                                    }}
                                  />
                                  <span className="text-sm">{subject.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground"><strong>Note:</strong> Registering for <strong>{academicYear}</strong> - <strong>{currentTerm}</strong>. The system will generate a unique ID{selectedRole === "student" ? ", roll number," : ""} and password. You can download the credential letter after registration.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={!selectedRole}><UserPlus className="h-4 w-4 mr-2" />Register User</Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
        {/* CLASS RECORDS */}
        {activeSection === "class-records" && (() => {
          const isAllDepts = !selectedClassDepartment || selectedClassDepartment === "all"
          const classStudents = studentUsers.filter(u => (u?.level || "") === selectedClassLevel && (isAllDepts || (u?.department || "") === selectedClassDepartment) && (u?.academicYear || "") === academicYear)
          const classGrades = pendingApprovals.filter(a => (a?.type || "") === "grade" && (a?.level || "") === selectedClassLevel && (isAllDepts || (a?.department || "") === selectedClassDepartment) && (a?.academicYear || "") === academicYear && (a?.term || "") === currentTerm)
          const classMaterials = pendingApprovals.filter(a => (a?.type || "") === "material" && (a?.level || "") === selectedClassLevel && (isAllDepts || (a?.department || "") === selectedClassDepartment) && (a?.academicYear || "") === academicYear && (a?.term || "") === currentTerm)

          return (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Class Records</CardTitle>
                  <CardDescription>View roll, grades, and materials organized by class cohort.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Academic Year</Label>
                      <Input value={academicYear} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Term</Label>
                      <Input value={currentTerm} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Class Level</Label>
                      <Select value={selectedClassLevel} onValueChange={setSelectedClassLevel}>
                        <SelectTrigger><SelectValue placeholder="Select class level" /></SelectTrigger>
                        <SelectContent>{Object.values(STUDENT_LEVELS).flat().map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={selectedClassDepartment || "all"} onValueChange={setSelectedClassDepartment}>
                        <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Arts">Arts</SelectItem>
                          <SelectItem value="Commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />The Roll</CardTitle>
                    <CardDescription>{classStudents.length} Students</CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[500px] overflow-y-auto">
                    {classStudents.length === 0 ? (
                      <div className="text-sm text-center text-muted-foreground py-4">No students registered in this cohort.</div>
                    ) : (
                      <div className="space-y-3">
                        {classStudents.map(s => (
                          <div key={s.id} className="text-sm border-b pb-2 last:border-0">
                            <p className="font-medium">{s.fullName || "Unnamed Student"}</p>
                            <p className="text-xs text-muted-foreground">ID: {s.generatedId}</p>
                            {s.rollNumber && <p className="text-xs text-muted-foreground">Roll: {s.rollNumber}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-1 border-secondary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" />Grades</CardTitle>
                    <CardDescription>{classGrades.length} Records</CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[500px] overflow-y-auto">
                    {classGrades.length === 0 ? (
                      <div className="text-sm text-center text-muted-foreground py-4">No grades for this cohort yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {classGrades.map(g => (
                          <div key={g.id} className="text-sm border-b pb-2 last:border-0">
                            <div className="flex justify-between">
                              <p className="font-medium">{g.title ? g.title.split('-')[0].trim() : "Untitled Grade"}</p>
                              <Badge variant="outline" className="text-[10px]">{g.grade || "N/A"}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{g.subject || "No Subject"} • {g.score || 0}%</p>
                            <div className="flex justify-between items-center mt-1">
                              <Badge variant={g.status === 'approved' ? 'default' : g.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">{g.status}</Badge>
                              <span className="text-[10px] text-muted-foreground">by {g.submittedBy}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-1 border-orange-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Materials</CardTitle>
                    <CardDescription>{classMaterials.length} Records</CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[500px] overflow-y-auto">
                    {classMaterials.length === 0 ? (
                      <div className="text-sm text-center text-muted-foreground py-4">No materials for this cohort yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {classMaterials.map(m => (
                          <div key={m.id} className="text-sm border-b pb-2 last:border-0">
                            <p className="font-medium">{m.title || "Untitled Material"}</p>
                            <p className="text-xs text-muted-foreground">{m.subject || "No Subject"}</p>
                            <div className="flex justify-between items-center mt-1">
                              <Badge variant={m.status === 'approved' ? 'default' : m.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                              <span className="text-[10px] text-muted-foreground">by {m.submittedBy}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })()}
        {/* GRADES */}
        {activeSection === "grades" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Grade Approvals</CardTitle><CardDescription>Review grades submitted by teachers</CardDescription></div>
                <Badge variant={gradeSubmissionOpen ? "default" : "destructive"}>{gradeSubmissionOpen ? "Submissions Open" : "Submissions Closed"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No pending grade approvals.</div>
              ) : (
                <div className="space-y-3">
                  {grades.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <ClipboardList className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">Submitted by {item.submittedBy} | {item.subject} | {item.date}</p>
                            <div className="mt-2 text-sm"><span className="font-medium">Grade:</span> {item.grade} ({item.score}%)</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleReject(item)}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                          <Button size="sm" onClick={() => handleApprove(item)}><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* APPROVALS */}
        {activeSection === "approvals" && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Pending Material Approvals</CardTitle><CardDescription>{materials.length} materials awaiting review</CardDescription></CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No pending materials.</div>
                ) : (
                  <div className="space-y-3">
                    {materials.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h3 className="font-semibold">{item.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">Submitted by {item.submittedBy} | {item.subject} | {item.date}</p>
                              {item.description && <p className="text-sm mt-2">{item.description}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleReject(item)}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                            <Button size="sm" onClick={() => handleApprove(item)}><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Pending Grade Approvals</CardTitle><CardDescription>{grades.length} grades awaiting review</CardDescription></CardHeader>
              <CardContent>
                {grades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No pending grades.</div>
                ) : (
                  <div className="space-y-3">
                    {grades.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <ClipboardList className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h3 className="font-semibold">{item.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">Submitted by {item.submittedBy} | {item.subject} | {item.date}</p>
                              <div className="mt-2 text-sm"><span className="font-medium">Grade:</span> {item.grade} ({item.score}%)</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleReject(item)}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                            <Button size="sm" onClick={() => handleApprove(item)}><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeSection === "announcements" && (
          <Card>
            <CardHeader><CardTitle>Create Announcement</CardTitle><CardDescription>Post important updates for students and staff</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="title">Announcement Title</Label><Input id="title" name="title" placeholder="e.g., School Holiday Notice" required /></div>
                <div className="space-y-2"><Label htmlFor="content">Content</Label><Textarea id="content" name="content" placeholder="Enter the announcement details..." className="min-h-[150px]" required /></div>
                <Button type="submit" className="w-full"><Megaphone className="h-4 w-4 mr-2" />Post Announcement</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* COMPLAINTS */}
        {activeSection === "complaints" && (
          <Card>
            <CardHeader><CardTitle>Student & Teacher Complaints</CardTitle><CardDescription>Review complaints submitted through the AI complaint bot</CardDescription></CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No complaints submitted yet.</div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((complaint) => (
                    <div key={complaint.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{complaint.subject}</h3>
                            <Badge variant={complaint.role === "student" ? "default" : "secondary"}>{complaint.role}</Badge>
                            {complaint.priority && <Badge variant={complaint.priority === "high" || complaint.priority === "urgent" ? "destructive" : complaint.priority === "medium" ? "default" : "outline"}>{complaint.priority}</Badge>}
                            {complaint.status === "resolved" && <Badge variant="outline" className="text-green-600 border-green-600">Resolved</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">By {complaint.name} | {new Date(complaint.date).toLocaleDateString()}</p>
                          <p className="text-sm mt-3">{complaint.description}</p>
                          {complaint.category && <p className="text-xs text-muted-foreground mt-2">Category: {complaint.category}</p>}
                        </div>
                      </div>
                      {complaint.status !== "resolved" && (
                        <div className="flex gap-2 justify-end mt-3">
                          <Button variant="outline" size="sm" onClick={() => { const updated = complaints.map((c) => c.id === complaint.id ? { ...c, status: "resolved" } : c); setComplaints(updated); localStorage.setItem("complaints", JSON.stringify(updated)) }}>Mark as Resolved</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* REPORTS */}
        {activeSection === "reports" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Generate Reports</CardTitle>
                <CardDescription>View and download reports for students and teachers by various filters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="students">Students</SelectItem><SelectItem value="teachers">Teachers</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Select value={reportFilterYear} onValueChange={setReportFilterYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Years</SelectItem>{ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={reportFilterTerm} onValueChange={setReportFilterTerm}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Terms</SelectItem>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={reportFilterGender} onValueChange={setReportFilterGender}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {reportType === "students" && (
                    <div className="space-y-2">
                      <Label>Class Level</Label>
                      <Select value={reportFilterLevel} onValueChange={setReportFilterLevel}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {[...STUDENT_LEVELS.JSS, ...STUDENT_LEVELS.SSS].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={reportFilterDepartment} onValueChange={setReportFilterDepartment}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Departments</SelectItem><SelectItem value="Arts">Arts</SelectItem><SelectItem value="Science">Science</SelectItem><SelectItem value="Commercial">Commercial</SelectItem><SelectItem value="General">General</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {reportType === "teachers" && (
                    <div className="space-y-2">
                      <Label>Qualification</Label>
                      <Select value={reportFilterQualification} onValueChange={setReportFilterQualification}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Qualifications</SelectItem>{QUALIFICATIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground"><strong>{filteredReportData.length}</strong> {reportType} match your filters</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadReportCSV} disabled={filteredReportData.length === 0}><Download className="h-4 w-4 mr-2" />Download CSV</Button>
                    <Button onClick={downloadReportPDF} disabled={filteredReportData.length === 0}><Printer className="h-4 w-4 mr-2" />Download Report</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredReportData.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Preview ({filteredReportData.length} records)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">ID</th>
                          <th className="text-left py-2 px-3 font-medium">Name</th>
                          <th className="text-left py-2 px-3 font-medium">Gender</th>
                          {reportType === "students" && <th className="text-left py-2 px-3 font-medium">Level</th>}
                          <th className="text-left py-2 px-3 font-medium">Department</th>
                          {reportType === "teachers" && <th className="text-left py-2 px-3 font-medium">Qualification</th>}
                          <th className="text-left py-2 px-3 font-medium">Year</th>
                          <th className="text-left py-2 px-3 font-medium">Term</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReportData.slice(0, 20).map((u) => (
                          <tr key={u.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3 font-mono text-xs">{u.generatedId}</td>
                            <td className="py-2 px-3">{u.fullName}</td>
                            <td className="py-2 px-3">{u.gender || "N/A"}</td>
                            {reportType === "students" && <td className="py-2 px-3">{u.level || "N/A"}</td>}
                            <td className="py-2 px-3">{u.department || "N/A"}</td>
                            {reportType === "teachers" && <td className="py-2 px-3">{u.qualification || "N/A"}</td>}
                            <td className="py-2 px-3">{u.academicYear || "N/A"}</td>
                            <td className="py-2 px-3">{u.term || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredReportData.length > 20 && <p className="text-sm text-muted-foreground text-center mt-3">Showing 20 of {filteredReportData.length} records. Download the full report for all data.</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts & Summary */}
            {filteredReportData.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Gender Pie Chart */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Gender Distribution</CardTitle></CardHeader>
                  <CardContent>
                    {(() => {
                      const maleCount = filteredReportData.filter((u: any) => u.gender === "Male").length;
                      const femaleCount = filteredReportData.filter((u: any) => u.gender === "Female").length;
                      const otherCount = filteredReportData.length - maleCount - femaleCount;
                      const genderData = [
                        ...(maleCount > 0 ? [{ name: "Male", value: maleCount }] : []),
                        ...(femaleCount > 0 ? [{ name: "Female", value: femaleCount }] : []),
                        ...(otherCount > 0 ? [{ name: "Other", value: otherCount }] : []),
                      ];
                      const COLORS = ["#3b82f6", "#ec4899", "#a855f7"];
                      return (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {genderData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Department Bar Chart */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Department Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {(() => {
                      const depts = ["Arts", "Science", "Commercial", "General"];
                      const deptData = depts.map((d) => ({
                        name: d,
                        count: filteredReportData.filter((u: any) => u.department === d).length,
                      })).filter((d) => d.count > 0);
                      const unspecified = filteredReportData.filter((u: any) => !u.department).length;
                      if (unspecified > 0) deptData.push({ name: "N/A", count: unspecified });
                      return (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={deptData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Level / Qualification Bar Chart */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{reportType === "students" ? "Level Distribution" : "Qualification Distribution"}</CardTitle></CardHeader>
                  <CardContent>
                    {(() => {
                      const chartData = reportType === "students"
                        ? [...STUDENT_LEVELS.JSS, ...STUDENT_LEVELS.SSS].map((l) => ({
                          name: l,
                          count: filteredReportData.filter((u: any) => u.level === l).length,
                        })).filter((d) => d.count > 0)
                        : QUALIFICATIONS.map((q) => ({
                          name: q.length > 12 ? q.slice(0, 12) + "…" : q,
                          count: filteredReportData.filter((u: any) => u.qualification === q).length,
                        })).filter((d) => d.count > 0);
                      return (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {activeSection === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />School Settings</CardTitle>
                <CardDescription>Manage academic year, terms, registration, and submission controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Academic Year</Label>
                    <Select value={academicYear} onValueChange={(v) => handleSettingsFieldChange("academicYear", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Changing this affects all new registrations and grade submissions.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Current Term</Label>
                    <Select value={currentTerm} onValueChange={(v) => handleSettingsFieldChange("currentTerm", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Set the active term for all school activities.</p>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold">Registration Controls</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">{studentRegistrationOpen ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-destructive" />}Student Registration</h4>
                        <p className="text-sm text-muted-foreground">Allow new student enrollment</p>
                      </div>
                      <Button variant={studentRegistrationOpen ? "default" : "outline"} size="sm" onClick={() => setStudentRegistrationOpen(!studentRegistrationOpen)}>
                        {studentRegistrationOpen ? <><ToggleRight className="h-4 w-4 mr-2" />Open</> : <><ToggleLeft className="h-4 w-4 mr-2" />Closed</>}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">{teacherRegistrationOpen ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-destructive" />}Teacher Registration</h4>
                        <p className="text-sm text-muted-foreground">Allow new teacher enrollment</p>
                      </div>
                      <Button variant={teacherRegistrationOpen ? "default" : "outline"} size="sm" onClick={() => setTeacherRegistrationOpen(!teacherRegistrationOpen)}>
                        {teacherRegistrationOpen ? <><ToggleRight className="h-4 w-4 mr-2" />Open</> : <><ToggleLeft className="h-4 w-4 mr-2" />Closed</>}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold">Submission Controls</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Grade Submission</h4>
                        <p className="text-sm text-muted-foreground">Allow teachers to submit grades</p>
                      </div>
                      <Button variant={gradeSubmissionOpen ? "default" : "outline"} size="sm" onClick={() => setGradeSubmissionOpen(!gradeSubmissionOpen)}>
                        {gradeSubmissionOpen ? <><ToggleRight className="h-4 w-4 mr-2" />Open</> : <><ToggleLeft className="h-4 w-4 mr-2" />Closed</>}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Material Upload</h4>
                        <p className="text-sm text-muted-foreground">Allow teachers to upload materials</p>
                      </div>
                      <Button variant={materialSubmissionOpen ? "default" : "outline"} size="sm" onClick={() => setMaterialSubmissionOpen(!materialSubmissionOpen)}>
                        {materialSubmissionOpen ? <><ToggleRight className="h-4 w-4 mr-2" />Open</> : <><ToggleLeft className="h-4 w-4 mr-2" />Closed</>}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Button onClick={saveSettings} className="w-full"><CheckCircle className="h-4 w-4 mr-2" />Save All Settings</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Current Configuration</CardTitle>
                  {settingsLastSaved && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Last saved: {settingsLastSaved}</p>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Academic Year</span><Badge>{academicYear}</Badge></div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Current Term</span><Badge>{currentTerm}</Badge></div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Grade Submission</span><Badge variant={gradeSubmissionOpen ? "default" : "destructive"}>{gradeSubmissionOpen ? "Open" : "Closed"}</Badge></div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Material Upload</span><Badge variant={materialSubmissionOpen ? "default" : "destructive"}>{materialSubmissionOpen ? "Open" : "Closed"}</Badge></div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Student Registration</span><Badge variant={studentRegistrationOpen ? "default" : "destructive"}>{studentRegistrationOpen ? "Open" : "Closed"}</Badge></div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg"><span className="text-sm font-medium">Teacher Registration</span><Badge variant={teacherRegistrationOpen ? "default" : "destructive"}>{teacherRegistrationOpen ? "Open" : "Closed"}</Badge></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Submission</DialogTitle><DialogDescription>Please provide a reason for rejecting this submission.</DialogDescription></DialogHeader>
          <Textarea placeholder="Enter rejection reason..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Confirmation Dialog */}
      <Dialog open={showSettingsConfirmDialog} onOpenChange={setShowSettingsConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-600" />Confirm Change</DialogTitle>
            <DialogDescription>
              Changing the <strong>{pendingSettingsChange?.field === "academicYear" ? "Academic Year" : "Term"}</strong> to <strong>{pendingSettingsChange?.value}</strong> will affect all new registrations, grade submissions, and reports. This action does not affect existing data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSettingsConfirmDialog(false); setPendingSettingsChange(null) }}>Cancel</Button>
            <Button onClick={confirmSettingsChange}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" />Registration Successful</DialogTitle>
            <DialogDescription>The {lastRegisteredUser?.role} has been registered. Download the credentials letter below.</DialogDescription>
          </DialogHeader>
          {lastRegisteredUser && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Name</span><span className="font-semibold">{lastRegisteredUser.fullName}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Role</span><Badge>{lastRegisteredUser.role}</Badge></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">User ID</span><span className="font-mono font-bold">{lastRegisteredUser.generatedId}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Password</span><span className="font-mono font-bold">{lastRegisteredUser.password}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Academic Year</span><span>{lastRegisteredUser.academicYear}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Term</span><span>{lastRegisteredUser.term}</span></div>
                {lastRegisteredUser.gender && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Gender</span><span>{lastRegisteredUser.gender}</span></div>}
                {lastRegisteredUser.level && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Level</span><span>{lastRegisteredUser.level}</span></div>}
                {lastRegisteredUser.department && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Department</span><span>{lastRegisteredUser.department}</span></div>}
                {lastRegisteredUser.qualification && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Qualification</span><span>{lastRegisteredUser.qualification}</span></div>}
                {lastRegisteredUser.rollNumber && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Roll Number</span><span className="font-mono font-bold">{lastRegisteredUser.rollNumber}</span></div>}
                {lastRegisteredUser.dateOfBirth && <div className="flex justify-between"><span className="text-sm text-muted-foreground">Date of Birth</span><span>{lastRegisteredUser.dateOfBirth}</span></div>}
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">Credentials have been simulated as sent to <strong>{lastRegisteredUser.email}</strong> and WhatsApp <strong>{lastRegisteredUser.phone}</strong>.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCredentialsDialog(false)}>Close</Button>
            <Button onClick={() => lastRegisteredUser && downloadCredentials(lastRegisteredUser)}><Download className="h-4 w-4 mr-2" />Download Credentials</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AIAssistant userRole="authority" />
    </DashboardLayout>
  )
}
