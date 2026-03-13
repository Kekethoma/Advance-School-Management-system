"use client"

import type React from "react"
import { DashboardLayout, type SidebarItem } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Upload, FileText, ClipboardList, CheckCircle, Clock, Megaphone,
  Mail, MessageCircle, BookOpen, AlertCircle, LayoutDashboard, History,
  Sparkles, Wand2, Lightbulb, Download, ShieldCheck, Users,
  CalendarCheck, Activity, FileSpreadsheet, CheckCircle2, XCircle, CalendarDays
} from "lucide-react"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { getGradeInfo, generateLessonPlan, getAcademicAdvice } from "@/lib/ai-engine"
import { AIAssistant } from "@/components/ai-assistant"
import { db } from "@/lib/db"
export default function TeacherDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [submissions, setSubmissions] = useState<any[]>([])
  const [stats, setStats] = useState({ materials: 0, grades: 0, pending: 0 })
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [acceptanceLetters, setAcceptanceLetters] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [assignedClasses, setAssignedClasses] = useState<string[]>([])
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([])
  const [gradeSubmissionOpen, setGradeSubmissionOpen] = useState(true)
  const [materialSubmissionOpen, setMaterialSubmissionOpen] = useState(true)
  const [schoolAcademicYear, setSchoolAcademicYear] = useState("")
  const [schoolTerm, setSchoolTerm] = useState("")
  const [aiGradeResult, setAiGradeResult] = useState<any>(null)
  const [lessonPlanInput, setLessonPlanInput] = useState({ subject: "", level: "", topic: "", duration: "45 mins" })
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState("")
  const [isGeneratingLessonPlan, setIsGeneratingLessonPlan] = useState(false)
  const [lessonPlanSubjects, setLessonPlanSubjects] = useState<string[]>([])
  const [academicTips, setAcademicTips] = useState<string[]>([])
  const [submissionForm, setSubmissionForm] = useState({
    materialSubject: "",
    materialLevel: "",
    gradeSubject: "",
    gradeLevel: "",
    gradeStudent: "",
    gradeLetter: "",
    gradeAssessmentType: ""
  })
  const [allSchoolApprovals, setAllSchoolApprovals] = useState<any[]>([])
  const [allRegistrations, setAllRegistrations] = useState<any[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, string>>({})
  const [isSavingAttendance, setIsSavingAttendance] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadData = async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      setCurrentUser(user)
      setAssignedClasses(user.assignedClasses || [])
      setAssignedSubjects(user.assignedSubjects || [])

      const schoolId = user.schoolId

      // Load school settings - unique per schoolId
      const settings = JSON.parse(localStorage.getItem(`schoolSettings_${schoolId}`) || "{}")
      if (settings.gradeSubmissionOpen !== undefined) setGradeSubmissionOpen(settings.gradeSubmissionOpen)
      if (settings.materialSubmissionOpen !== undefined) setMaterialSubmissionOpen(settings.materialSubmissionOpen)
      if (settings.academicYear) setSchoolAcademicYear(settings.academicYear)
      if (settings.currentTerm) setSchoolTerm(settings.currentTerm)

      const approvals = await db.fetch<any>("approvals", schoolId, "approvals")
      setAllSchoolApprovals(approvals)

      // Teachers see materials and grades they submitted
      const teacherSubmissions = approvals.filter((a: any) => a.submittedBy === user.fullName || a.teacherId === user.generatedId)
      setSubmissions(teacherSubmissions)

      setStats({
        materials: teacherSubmissions.filter((s: any) => s.type === "material").length,
        grades: teacherSubmissions.filter((s: any) => s.type === "grade").length,
        pending: teacherSubmissions.filter((s: any) => s.status === "pending" || s.status === "awaiting_exams").length,
      })

      const letters = JSON.parse(localStorage.getItem("acceptanceLetters") || "[]")
      const userLetters = letters.filter((l: any) => l.recipientEmail === user.email && l.schoolId === schoolId)
      setAcceptanceLetters(userLetters)

      const storedAnnouncements = await db.fetch<any>("announcements", schoolId, "announcements")
      setAnnouncements(storedAnnouncements)

      const registrations = await db.fetch<any>("users", schoolId, "registrations")
      setAllRegistrations(registrations)

      const storedAttendance = await db.fetch<any>("attendance", schoolId, `attendance_${schoolId}`)
      setAttendanceRecords(storedAttendance)

      setAcademicTips(getAcademicAdvice("teacher"))
      setIsLoaded(true)
    }

    loadData()
  }, [])

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const schoolId = currentUser.schoolId

    const newApproval = {
      id: Date.now(),
      type: "material",
      title: formData.get("material-title")?.toString(),
      subject: submissionForm.materialSubject,
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      submittedBy: currentUser.fullName,
      teacherId: currentUser.generatedId,
      description: formData.get("material-desc")?.toString(),
      level: submissionForm.materialLevel,
      schoolId
    }

    await db.insert("approvals", newApproval, "approvals")
    setSubmissions(prev => [newApproval, ...prev])
    alert("Material uploaded successfully! Pending approval.")
      ; (e.target as HTMLFormElement).reset()
    setSubmissionForm(prev => ({ ...prev, materialSubject: "", materialLevel: "" }))
  }

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const schoolId = currentUser.schoolId

    const newApproval = {
      id: Date.now(),
      type: "grade",
      title: `${formData.get("student-name")} - ${submissionForm.gradeSubject} ${submissionForm.gradeAssessmentType}`,
      subject: submissionForm.gradeSubject,
      grade: submissionForm.gradeLetter,
      score: parseInt(formData.get("grade-score") as string),
      date: new Date().toISOString().split("T")[0],
      status: "awaiting_exams",
      submittedBy: currentUser.fullName,
      teacherId: currentUser.generatedId,
      studentId: submissionForm.gradeStudent,
      level: submissionForm.gradeLevel,
      schoolId
    }

    await db.insert("approvals", newApproval, "approvals")
    setSubmissions(prev => [newApproval, ...prev])
    alert("Grade submitted to Exams Office for review.")
      ; (e.target as HTMLFormElement).reset()
    setAiGradeResult(null)
    setSubmissionForm(prev => ({ ...prev, gradeSubject: "", gradeLevel: "", gradeStudent: "", gradeLetter: "", gradeAssessmentType: "" }))
  }

  const runAiGrader = (score: string) => {
    const numScore = parseInt(score)
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      setAiGradeResult(null)
      return
    }
    const info = getGradeInfo(numScore)
    setAiGradeResult(info)
  }

  const handleGenerateLessonPlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lessonPlanInput.subject || !lessonPlanInput.topic) {
      alert("Please enter subject and topic")
      return
    }
    setIsGeneratingLessonPlan(true)
    setTimeout(() => {
      const plan = generateLessonPlan(lessonPlanInput.subject, lessonPlanInput.level, lessonPlanInput.topic, lessonPlanInput.duration)
      setGeneratedLessonPlan(plan)
      setIsGeneratingLessonPlan(false)
    }, 1500)
  }

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const newAnnouncement = {
      id: Date.now().toString(),
      title: formData.get("title")?.toString(),
      content: formData.get("content")?.toString(),
      postedBy: user.fullName || "Teacher",
      date: new Date().toLocaleDateString(),
      comments: [],
      schoolId: user.schoolId
    }

    await db.insert("announcements", newAnnouncement, "announcements")
    setAnnouncements(prev => [newAnnouncement, ...prev])
    alert("Announcement posted successfully!")
      ; (e.target as HTMLFormElement).reset()
  }

  const handleAddComment = async (announcementId: string) => {
    const comment = commentText[announcementId]
    if (!comment || !comment.trim()) return
    const user = JSON.parse(localStorage.getItem("user") || "{}")

    const announcement = announcements.find(a => a.id === announcementId)
    if (!announcement) return

    const newComment = { id: Date.now().toString(), author: user.fullName || "Teacher", text: comment, date: new Date().toISOString() }
    const updatedComments = [...(announcement.comments || []), newComment]

    await db.update("announcements", announcementId, { comments: updatedComments }, "announcements")

    setAnnouncements(prev => prev.map(ann => ann.id === announcementId ? { ...ann, comments: updatedComments } : ann))
    setCommentText({ ...commentText, [announcementId]: "" })
  }

  const handleSaveAttendance = async () => {
    if (!currentUser?.masterClass) return
    setIsSavingAttendance(true)
    const schoolId = currentUser.schoolId
    const newRecord = {
      id: `${attendanceDate}_${currentUser.masterClass}`, // Key for easier upsert
      date: attendanceDate,
      level: currentUser.masterClass,
      records: currentAttendance,
      summary: {
        present: Object.values(currentAttendance).filter(s => s === "present").length,
        absent: Object.values(currentAttendance).filter(s => s === "absent").length,
        late: Object.values(currentAttendance).filter(s => s === "late").length,
      },
      savedAt: new Date().toISOString(),
      schoolId
    }

    await db.upsert("attendance", newRecord, `attendance_${schoolId}`)

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(r => r.date === attendanceDate && r.level === currentUser.masterClass)
      if (idx > -1) {
        const updated = [...prev]
        updated[idx] = newRecord
        return updated
      }
      return [...prev, newRecord]
    })

    setIsSavingAttendance(false)
    alert("Attendance saved successfully!")
  }

  const toggleGradePublish = async (gradeId: number, published: boolean) => {
    const schoolId = currentUser.schoolId

    // Safety check: Only allowed if item is approved
    const item = allSchoolApprovals.find((a: any) => a.id === gradeId && a.schoolId === schoolId)
    if (published && item?.status !== "approved") {
      alert("Only approved grades can be published.")
      return
    }

    await db.update("approvals", gradeId, { published }, "approvals")

    setAllSchoolApprovals(prev => prev.map(a => a.id === gradeId ? { ...a, published } : a))
  }

  const handleForwardToPrincipal = async (gradeId: number) => {
    await db.update("approvals", gradeId, { status: "pending" }, "approvals")

    setAllSchoolApprovals(prev => prev.map(a => a.id === gradeId ? { ...a, status: "pending" } : a))
    alert("Grade forwarded to principal for final approval.")
  }

  const handleDownloadClassResults = () => {
    if (!currentUser?.masterClass) return
    const classStudents = allRegistrations.filter(r => r.role === "student" && r.level === currentUser.masterClass)
    const classGrades = allSchoolApprovals.filter(a => a.type === "grade" && a.level === currentUser.masterClass && a.published)

    let csv = "Roll Number,Student Name,Subject,Grade,Score\n"
    classStudents.forEach(student => {
      const studentGrades = classGrades.filter(g => g.studentId === student.generatedId || g.studentEmail === student.email)
      if (studentGrades.length === 0) {
        csv += `${student.rollNumber || ""},${student.fullName},N/A,N/A,N/A\n`
      } else {
        studentGrades.forEach(g => {
          csv += `${student.rollNumber || ""},${student.fullName},${g.subject},${g.grade},${g.score}\n`
        })
      }
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Results_${currentUser.masterClass.replace(/\s+/g, "_")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const hasAssignments = assignedClasses.length > 0 && assignedSubjects.length > 0

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "materials", label: "Upload Materials", icon: <Upload className="h-5 w-5" /> },
    { id: "grades", label: "Submit Grades", icon: <ClipboardList className="h-5 w-5" /> },
    { id: "lesson-planner", label: "AI Lesson Planner", icon: <Wand2 className="h-5 w-5" /> },
    { id: "announcements", label: "Announcements", icon: <Megaphone className="h-5 w-5" />, badge: announcements.length },
    { id: "history", label: "Submission History", icon: <History className="h-5 w-5" />, badge: stats.pending },
    { id: "complaints", label: "Submit Complaint", icon: <MessageCircle className="h-5 w-5" /> },
  ]

  if (currentUser?.specialRole === "HOD") {
    sidebarItems.splice(4, 0, { id: "hod-hub", label: "Department Hub", icon: <Users className="h-5 w-5" /> })
  } else if (currentUser?.specialRole === "Exams Officer") {
    sidebarItems.splice(4, 0, { id: "exam-centre", label: "Exam Centre", icon: <ShieldCheck className="h-5 w-5" /> })
    sidebarItems.splice(5, 0, { id: "grade-publish", label: "Publish Grades", icon: <CheckCircle2 className="h-5 w-5" /> })
  } else if (currentUser?.specialRole === "Class Master") {
    sidebarItems.splice(4, 0, { id: "class-manager", label: "Class Manager", icon: <Users className="h-5 w-5" /> })
    sidebarItems.splice(5, 0, { id: "roll-call", label: "Roll Call", icon: <CalendarCheck className="h-5 w-5" /> })
    sidebarItems.splice(6, 0, { id: "class-analytics", label: "Class Reports", icon: <Activity className="h-5 w-5" /> })
  }

  if (!isLoaded) {
    return (
      <DashboardLayout role="teacher" sidebarItems={sidebarItems} activeSection={activeSection} onSectionChange={setActiveSection}>
        <div className="flex items-center justify-center py-12"><div className="animate-pulse">Loading dashboard...</div></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="teacher" sidebarItems={sidebarItems} activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="space-y-6">

        {/* OVERVIEW */}
        {activeSection === "overview" && (
          <>
            {currentUser && (
              <Card className="bg-secondary/5 border-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />{currentUser.fullName}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {currentUser.department && <Badge>{currentUser.department} Department</Badge>}
                      <span className="text-sm">Teacher ID: {currentUser.generatedId}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {academicTips.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Pedagogy Coach
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {academicTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="h-1 w-1 rounded-full bg-primary mt-2" />
                        <p>{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!hasAssignments && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400"><AlertCircle className="h-5 w-5" />Assignment Required</CardTitle>
                  <CardDescription className="text-yellow-600 dark:text-yellow-500">You don't have any classes or subjects assigned yet. Please contact the principal to get assigned before uploading materials or submitting grades.</CardDescription>
                </CardHeader>
              </Card>
            )}

            {(!gradeSubmissionOpen || !materialSubmissionOpen) && (
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400"><AlertCircle className="h-5 w-5" />Submission Status</CardTitle>
                  <CardDescription className="text-orange-600 dark:text-orange-500">
                    {!gradeSubmissionOpen && !materialSubmissionOpen
                      ? "Grade submission and material upload are currently closed by the principal."
                      : !gradeSubmissionOpen
                        ? "Grade submission is currently closed by the principal."
                        : "Material upload is currently closed by the principal."}
                    {schoolAcademicYear && ` (${schoolAcademicYear} - ${schoolTerm})`}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {(assignedClasses.length > 0 || assignedSubjects.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {assignedClasses.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">My Assigned Classes</CardTitle></CardHeader>
                    <CardContent><div className="flex flex-wrap gap-2">{assignedClasses.map((cls) => <Badge key={cls} variant="secondary">{cls}</Badge>)}</div></CardContent>
                  </Card>
                )}
                {assignedSubjects.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">My Assigned Subjects</CardTitle></CardHeader>
                    <CardContent><div className="flex flex-wrap gap-2">{assignedSubjects.map((subj) => <Badge key={subj} variant="secondary">{subj}</Badge>)}</div></CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="grid gap-4 grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Materials Uploaded</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.materials}</div><p className="text-xs text-muted-foreground">Course resources</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Grades Submitted</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.grades}</div><p className="text-xs text-muted-foreground">Student grades</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Approval</CardTitle><Clock className="h-4 w-4 text-orange-600" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.pending}</div><p className="text-xs text-muted-foreground">Awaiting review</p></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Recent Submissions</CardTitle>
                  <CardDescription>Track the status of your uploaded materials and grades</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveSection("history")}>View All</Button>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">No recent submissions.</div>
                ) : (
                  <div className="space-y-4">
                    {submissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          {submission.type === "material" ? <FileText className="h-4 w-4 text-muted-foreground" /> : <ClipboardList className="h-4 w-4 text-muted-foreground" />}
                          <div>
                            <p className="font-medium text-sm">{submission.title}</p>
                            <p className="text-xs text-muted-foreground">{submission.subject} • {submission.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={submission.status === "approved" ? "default" : submission.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">{submission.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {acceptanceLetters.length > 0 && (
              <Card className="border-green-500">
                <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-green-600" />Acceptance Letter</CardTitle></CardHeader>
                <CardContent>
                  {acceptanceLetters.map((letter) => (
                    <div key={letter.id} className="bg-muted/50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">{letter.subject}</h3>
                      <p className="text-sm whitespace-pre-line">{letter.message}</p>
                      <p className="text-xs text-muted-foreground mt-3">Received: {new Date(letter.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* UPLOAD MATERIALS */}
        {activeSection === "materials" && (
          <Card>
            <CardHeader><CardTitle>Upload Study Materials</CardTitle><CardDescription>Share course materials with assigned classes only</CardDescription></CardHeader>
            <CardContent>
              {!hasAssignments ? (
                <div className="text-center py-12 text-muted-foreground">You need to be assigned classes and subjects by the principal before you can upload materials.</div>
              ) : !materialSubmissionOpen ? (
                <div className="text-center py-12 text-muted-foreground">Material upload is currently closed by the principal.{schoolAcademicYear && ` (${schoolAcademicYear} - ${schoolTerm})`}</div>
              ) : (
                <form onSubmit={handleMaterialSubmit} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="material-title">Material Title</Label><Input id="material-title" name="material-title" placeholder="e.g., Chapter 5 - Calculus" required /></div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="material-subject">Subject</Label>
                      <Select required value={submissionForm.materialSubject} onValueChange={(v) => setSubmissionForm(prev => ({ ...prev, materialSubject: v }))}>
                        <SelectTrigger id="material-subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                        <SelectContent>{assignedSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-class">Class Level</Label>
                      <Select required value={submissionForm.materialLevel} onValueChange={(v) => setSubmissionForm(prev => ({ ...prev, materialLevel: v }))}>
                        <SelectTrigger id="material-class"><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{assignedClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="material-desc">Description</Label><Textarea id="material-desc" name="material-desc" placeholder="Brief description of the material" /></div>
                  <div className="space-y-2"><Label htmlFor="material-file">Upload File</Label><Input id="material-file" name="material-file" type="file" accept=".pdf,.doc,.docx" required /></div>
                  <Button type="submit" className="w-full"><Upload className="h-4 w-4 mr-2" />Upload Material</Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* SUBMIT GRADES */}
        {activeSection === "grades" && (
          <Card>
            <CardHeader><CardTitle>Submit Student Grades</CardTitle><CardDescription>Enter grades for your assigned subjects only</CardDescription></CardHeader>
            <CardContent>
              {assignedSubjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">You need to be assigned subjects by the principal before you can submit grades.</div>
              ) : !gradeSubmissionOpen ? (
                <div className="text-center py-12 text-muted-foreground">Grade submission is currently closed by the principal.{schoolAcademicYear && ` (${schoolAcademicYear} - ${schoolTerm})`}</div>
              ) : (
                <form onSubmit={handleGradeSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="grade-student">Student Name</Label>
                      <Input id="student-name" name="student-name" placeholder="Full Name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade-student-id">Student ID / Roll No</Label>
                      <Input id="grade-student-id" name="grade-student-id" placeholder="e.g. S1234" required onChange={(e) => setSubmissionForm(prev => ({ ...prev, gradeStudent: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="grade-level">Class Level</Label>
                      <Select required value={submissionForm.gradeLevel} onValueChange={(v) => setSubmissionForm(prev => ({ ...prev, gradeLevel: v }))}>
                        <SelectTrigger id="grade-level"><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>{assignedClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade-subject">Subject</Label>
                      <Select required value={submissionForm.gradeSubject} onValueChange={(v) => setSubmissionForm(prev => ({ ...prev, gradeSubject: v }))}>
                        <SelectTrigger id="grade-subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                        <SelectContent>{assignedSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade-assessment">Assessment Type</Label>
                    <Select required value={submissionForm.gradeAssessmentType} onValueChange={(v) => setSubmissionForm(prev => ({ ...prev, gradeAssessmentType: v }))}>
                      <SelectTrigger id="grade-assessment"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent><SelectItem value="exam">Exam</SelectItem><SelectItem value="quiz">Quiz</SelectItem><SelectItem value="assignment">Assignment</SelectItem><SelectItem value="project">Project</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="grade-score">Numerical Score (0-100)</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] flex items-center gap-1 text-primary"
                          onClick={() => {
                            const scoreInput = document.getElementById("grade-score") as HTMLInputElement
                            runAiGrader(scoreInput.value)
                          }}
                        >
                          <Sparkles className="h-3 w-3" />
                          AI Grade
                        </Button>
                      </div>
                      <Input id="grade-score" name="grade-score" type="number" min="0" max="100" placeholder="95" required onChange={(e) => runAiGrader(e.target.value)} />
                      {aiGradeResult && (
                        <p className={`text-[10px] font-medium ${aiGradeResult.color} animate-in fade-in slide-in-from-top-1`}>
                          AI suggests: {aiGradeResult.grade}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade-letter">Letter Grade</Label>
                      <Select required value={submissionForm.gradeLetter} onValueChange={(v) => setSubmissionForm(prev => ({ ...prev, gradeLetter: v }))}>
                        <SelectTrigger id="grade-letter">
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="C+">C+</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                          <SelectItem value="F">F</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade-comments">Comments (Optional)</Label>
                    <Textarea
                      id="grade-comments"
                      name="grade-comments"
                      placeholder="Additional feedback for the student"
                      defaultValue={aiGradeResult?.comment ? `${aiGradeResult.comment} \n\nTip: ${aiGradeResult.tip}` : ""}
                    />
                  </div>
                  <Button type="submit" className="w-full"><ClipboardList className="h-4 w-4 mr-2" />Submit Grade</Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI LESSON PLANNER */}
        {activeSection === "lesson-planner" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  AI Lesson Planner
                </CardTitle>
                <CardDescription>Generate comprehensive lesson plans for your assigned subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateLessonPlan} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lesson-subject">Subject</Label>
                      <Select
                        onValueChange={(v) => setLessonPlanInput({ ...lessonPlanInput, subject: v })}
                        required
                      >
                        <SelectTrigger id="lesson-subject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignedSubjects.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lesson-level">Grade Level</Label>
                      <Select
                        onValueChange={(v) => setLessonPlanInput({ ...lessonPlanInput, level: v })}
                        required
                      >
                        <SelectTrigger id="lesson-level">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignedClasses.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="lesson-topic">Lesson Topic</Label>
                      <Input
                        id="lesson-topic"
                        placeholder="e.g., Introduction to Photosynthesis"
                        required
                        value={lessonPlanInput.topic}
                        onChange={(e) => setLessonPlanInput({ ...lessonPlanInput, topic: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lesson-duration">Duration</Label>
                      <Select
                        defaultValue="45 mins"
                        onValueChange={(v) => setLessonPlanInput({ ...lessonPlanInput, duration: v })}
                      >
                        <SelectTrigger id="lesson-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="35 mins">35 mins</SelectItem>
                          <SelectItem value="45 mins">45 mins</SelectItem>
                          <SelectItem value="60 mins">60 mins</SelectItem>
                          <SelectItem value="90 mins">90 mins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isGeneratingLessonPlan}>
                    {isGeneratingLessonPlan ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        AI is thinking...
                      </div>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Lesson Plan
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {generatedLessonPlan && (
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Generated Lesson Plan</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => {
                    const blob = new Blob([generatedLessonPlan], { type: "text/markdown" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `Lesson_Plan_${lessonPlanInput.topic.replace(/\s+/g, "_")}.md`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF/MD
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-6 rounded-lg overflow-auto max-h-[600px] prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{generatedLessonPlan}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeSection === "announcements" && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Create Announcement</CardTitle><CardDescription>Post important updates for students</CardDescription></CardHeader>
              <CardContent>
                <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="title">Announcement Title</Label><Input id="title" name="title" placeholder="e.g., Upcoming Exam Schedule" required /></div>
                  <div className="space-y-2"><Label htmlFor="content">Content</Label><Textarea id="content" name="content" placeholder="Enter the announcement details..." className="min-h-[150px]" required /></div>
                  <Button type="submit" className="w-full"><Megaphone className="h-4 w-4 mr-2" />Post Announcement</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent Announcements</CardTitle></CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No announcements yet</div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="border rounded-lg p-4 space-y-3">
                        <div>
                          <div className="flex items-start justify-between"><h3 className="font-semibold text-lg">{announcement.title}</h3><Badge variant="outline">{announcement.postedBy}</Badge></div>
                          <p className="text-sm text-muted-foreground mt-1">{announcement.date}</p>
                          <p className="mt-2">{announcement.content}</p>
                        </div>
                        <div className="border-t pt-3 space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground"><MessageCircle className="h-4 w-4" /><span>{announcement.comments?.length || 0} comments</span></div>
                          {announcement.comments?.map((comment: any) => (
                            <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-start justify-between"><span className="font-medium text-sm">{comment.author}</span><span className="text-xs text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</span></div>
                              <p className="text-sm mt-1">{comment.text}</p>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Textarea placeholder="Add a comment..." value={commentText[announcement.id] || ""} onChange={(e) => setCommentText({ ...commentText, [announcement.id]: e.target.value })} className="min-h-[60px]" />
                            <Button size="icon" onClick={() => handleAddComment(announcement.id)}><Megaphone className="h-4 w-4" /></Button>
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

        {/* SUBMISSION HISTORY */}
        {activeSection === "history" && (
          <Card>
            <CardHeader><CardTitle>Submission History</CardTitle><CardDescription>Track your materials and grades submissions</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {submission.type === "material" ? <FileText className="h-5 w-5 text-muted-foreground" /> : <ClipboardList className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <div className="flex items-center gap-2"><h3 className="font-medium">{submission.title}</h3><Badge variant={submission.status === "approved" ? "default" : "secondary"}>{submission.status}</Badge></div>
                        <p className="text-sm text-muted-foreground">{submission.subject} | {submission.date}</p>
                      </div>
                    </div>
                    {submission.status === "approved" ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-yellow-600" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* HOD HUB */}
        {activeSection === "hod-hub" && currentUser?.specialRole === "HOD" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Oversight: {currentUser.department}</CardTitle>
                <CardDescription>Review all submissions from teachers in your department</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const deptSubmissions = allSchoolApprovals.filter(a => {
                    const teacher = allRegistrations.find(r => r.generatedId === a.teacherId)
                    return teacher?.department === currentUser.department
                  })
                  return deptSubmissions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">No submissions found for your department.</div>
                  ) : (
                    <div className="space-y-4">
                      {deptSubmissions.map((s) => (
                        <div key={s.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-sm">{s.title}</p>
                            <p className="text-xs text-muted-foreground">{s.submittedBy} • {s.subject} • {s.date}</p>
                          </div>
                          <Badge variant={s.status === "approved" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}>{s.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* EXAM CENTRE */}
        {activeSection === "exam-centre" && currentUser?.specialRole === "Exams Officer" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>School-Wide Exam Monitoring</CardTitle>
                <CardDescription>Status of all grade submissions across the school</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const allGrades = allSchoolApprovals.filter(a => a.type === "grade")
                  const approved = allGrades.filter(g => g.status === "approved").length
                  const pending = allGrades.filter(g => g.status === "pending").length
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{approved}</p>
                          <p className="text-xs text-muted-foreground">Approved Grades</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{pending}</p>
                          <p className="text-xs text-muted-foreground">Pending Grades</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Awaiting Review (Submit to Principal)</h4>
                        {allSchoolApprovals.filter(a => a.type === "grade" && a.status === "awaiting_exams").length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2 italic">No grades awaiting review.</p>
                        ) : (
                          allSchoolApprovals.filter(a => a.type === "grade" && a.status === "awaiting_exams").map((g) => (
                            <div key={g.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded border border-yellow-500/20">
                              <div>
                                <p className="font-medium text-xs">{g.title}</p>
                                <p className="text-[10px] text-muted-foreground">{g.submittedBy} • {g.subject}</p>
                              </div>
                              <Button size="sm" variant="default" className="h-6 text-[10px] bg-yellow-600 hover:bg-yellow-700" onClick={() => handleForwardToPrincipal(g.id)}>
                                Forward to Principal
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-medium text-sm">Recent Grading Activity</h4>
                        {allGrades.slice(0, 10).map((g) => (
                          <div key={g.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span>{g.title}</span>
                            <Badge variant={g.status === "approved" ? "default" : "secondary"} className="text-[10px]">{g.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ROLL CALL */}
        {activeSection === "roll-call" && currentUser?.specialRole === "Class Master" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" />Roll Call: {currentUser.masterClass}</CardTitle>
                <CardDescription>Daily attendance for your master class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-xs">Select Date</Label>
                      <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="w-[200px]" />
                    </div>
                  </div>

                  {(() => {
                    const classStudents = allRegistrations.filter(r => r.role === "student" && r.level === currentUser.masterClass)
                    return classStudents.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">No students registered in {currentUser.masterClass}.</div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-2 font-medium text-xs border-b pb-2">
                          <span className="col-span-1">Name</span>
                          <span className="col-span-3 text-right">Status</span>
                        </div>
                        {classStudents.map((student) => (
                          <div key={student.id} className="grid grid-cols-4 gap-2 items-center text-sm py-2 border-b last:border-0">
                            <span className="col-span-1 truncate font-medium">{student.fullName}</span>
                            <div className="col-span-3 flex justify-end gap-1">
                              {["present", "late", "absent"].map(status => (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant={currentAttendance[student.id] === status ? "default" : "outline"}
                                  className={`capitalize px-2 h-7 text-[10px] ${currentAttendance[student.id] === status ?
                                    (status === "present" ? "bg-green-600 hover:bg-green-700" : status === "late" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-destructive") : ""}`}
                                  onClick={() => setCurrentAttendance({ ...currentAttendance, [student.id]: status })}
                                >
                                  {status}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <Button className="w-full mt-4" onClick={handleSaveAttendance} disabled={isSavingAttendance || Object.keys(currentAttendance).length === 0}>
                          {isSavingAttendance ? "Saving..." : "Save Daily Attendance"}
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CLASS ANALYTICS */}
        {activeSection === "class-analytics" && currentUser?.specialRole === "Class Master" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Class Reports: {currentUser.masterClass}</CardTitle>
                <CardDescription>Academic and attendance performance summaries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  {(() => {
                    const classStudents = allRegistrations.filter(r => r.role === "student" && r.level === currentUser.masterClass)
                    const classAttendance = attendanceRecords.filter(r => r.level === currentUser.masterClass)
                    const totalDays = classAttendance.length
                    const avgPresent = totalDays > 0 ? (classAttendance.reduce((acc, r) => acc + r.summary.present, 0) / (totalDays * classStudents.length) * 100).toFixed(1) : "0"

                    return (
                      <>
                        <Card className="bg-muted/30">
                          <CardHeader className="p-3"><CardTitle className="text-xs">Total Students</CardTitle></CardHeader>
                          <CardContent className="p-3 pt-0"><div className="text-xl font-bold">{classStudents.length}</div></CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                          <CardHeader className="p-3"><CardTitle className="text-xs">Avg Attendance</CardTitle></CardHeader>
                          <CardContent className="p-3 pt-0"><div className="text-xl font-bold">{avgPresent}%</div></CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                          <CardHeader className="p-3"><CardTitle className="text-xs">Days Recorded</CardTitle></CardHeader>
                          <CardContent className="p-3 pt-0"><div className="text-xl font-bold">{totalDays}</div></CardContent>
                        </Card>
                      </>
                    )
                  })()}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Recent Attendance Records</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Date</th>
                          <th className="text-center p-2">Present</th>
                          <th className="text-center p-2">Late</th>
                          <th className="text-center p-2">Absent</th>
                          <th className="text-right p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.filter(r => r.level === currentUser.masterClass).map((r, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2 font-medium">{r.date}</td>
                            <td className="p-2 text-center text-green-600">{r.summary.present}</td>
                            <td className="p-2 text-center text-yellow-600">{r.summary.late}</td>
                            <td className="p-2 text-center text-destructive">{r.summary.absent}</td>
                            <td className="p-2 text-right">
                              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setAttendanceDate(r.date); setCurrentAttendance(r.records); setActiveSection("roll-call") }}>View</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* GRADE PUBLISHING */}
        {activeSection === "grade-publish" && currentUser?.specialRole === "Exams Officer" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Grade Publishing Centre</CardTitle>
                <CardDescription>Officially publish approved grades to students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const approvedGrades = allSchoolApprovals.filter(a => a.type === "grade" && a.status === "approved")
                    return approvedGrades.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No approved grades found to publish. (Must be approved by Principal first)</div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg text-sm">
                          <span>Total Approved: <strong>{approvedGrades.length}</strong></span>
                          <span>Published: <strong>{approvedGrades.filter(g => g.published).length}</strong></span>
                        </div>
                        <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
                          {approvedGrades.map((grade) => (
                            <div key={grade.id} className="p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                              <div>
                                <p className="font-medium text-sm">{grade.title}</p>
                                <p className="text-[10px] text-muted-foreground">{grade.subject} • {grade.level} • {grade.date}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {grade.published ? (
                                  <Badge variant="default" className="text-[10px] bg-green-600">Published</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px]">Private</Badge>
                                )}
                                <Button
                                  size="sm"
                                  variant={grade.published ? "outline" : "default"}
                                  className="h-7 text-[10px]"
                                  onClick={() => toggleGradePublish(grade.id, !grade.published)}
                                >
                                  {grade.published ? "Unpublish" : "Publish"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {activeSection === "class-manager" && currentUser?.specialRole === "Class Master" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Class Management: {currentUser.masterClass}</CardTitle>
                    <CardDescription>Overview of students in your assigned class</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownloadClassResults}>
                    <Download className="h-4 w-4 mr-2" />
                    Download All Results
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const classStudents = allRegistrations.filter(r => r.role === "student" && r.level === currentUser.masterClass)
                  return classStudents.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">No students registered in {currentUser.masterClass}.</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 font-medium text-xs border-b pb-2">
                        <span>Roll No</span>
                        <span>Full Name</span>
                        <span className="text-right">Action</span>
                      </div>
                      {classStudents.map((student) => {
                        const studentGrades = allSchoolApprovals.filter(a => a.type === "grade" && (a.studentId === student.generatedId || a.studentEmail === student.email))
                        return (
                          <div key={student.id} className="space-y-2 py-2 border-b last:border-0">
                            <div className="grid grid-cols-3 gap-2 text-sm items-center">
                              <span className="font-mono text-[10px]">{student.rollNumber || "N/A"}</span>
                              <span className="font-medium">{student.fullName}</span>
                              <div className="text-right">
                                <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => {
                                  const details = document.getElementById(`details-${student.id}`)
                                  if (details) details.classList.toggle("hidden")
                                }}>
                                  {studentGrades.length} Grades
                                </Badge>
                              </div>
                            </div>
                            <div id={`details-${student.id}`} className="hidden bg-muted/30 rounded p-2 text-xs space-y-1">
                              {studentGrades.length === 0 ? (
                                <p className="text-muted-foreground italic">No grades recorded yet.</p>
                              ) : (
                                studentGrades.map((g, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <span>{g.subject} ({g.title})</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold">{g.grade}</span>
                                      <Badge variant={g.status === "approved" ? "default" : "secondary"} className="text-[8px] h-3 px-1">{g.status}</Badge>
                                      {g.published && <CheckCircle className="h-2 w-2 text-green-600" />}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )}
        {/* COMPLAINTS */}
        {activeSection === "complaints" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" />Submit a Complaint</CardTitle>
                <CardDescription>Your complaint will be reviewed confidentially by the principal only.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/complaint-bot"><Button className="w-full">Open Complaint Assistant</Button></Link>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
      <AIAssistant userRole="teacher" />
    </DashboardLayout>
  )
}
