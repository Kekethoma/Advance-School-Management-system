"use client"

import { DashboardLayout, type SidebarItem } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Download, BookOpen, Award, TrendingUp, MessageSquare, Send,
  Mail, MessageCircle, LayoutDashboard, GraduationCap, FileText,
  Sparkles, Lightbulb, BookOpen as BookIcon
} from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { getSubjectsForStudent } from "@/lib/subjects-data"
import { getAcademicAdvice } from "@/lib/ai-engine"
import { AIAssistant } from "@/components/ai-assistant"
import { db } from "@/lib/db"

export default function StudentDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [grades, setGrades] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({})
  const [acceptanceLetters, setAcceptanceLetters] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([])
  const [academicTips, setAcademicTips] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadData = async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      setCurrentUser(user)
      if (user.level) {
        const subjects = getSubjectsForStudent(user.level, user.department)
        setAssignedSubjects(subjects)
      }
      const schoolId = user.schoolId
      const approvals = await db.fetch<any>("approvals", schoolId, "approvals")

      // Filter grades for this specific student - only published once approved
      const studentGrades = approvals.filter((a: any) =>
        a.type === "grade" &&
        (a.studentId === user.generatedId || a.studentEmail === user.email) &&
        a.published === true
      )
      setGrades(studentGrades)

      // Filter materials for this student's level - only approved ones
      const studentMaterials = approvals.filter((a: any) => a.type === "material" && a.level === user.level && a.status === "approved")
      setMaterials(studentMaterials)

      const storedAnnouncements = await db.fetch<any>("announcements", schoolId, "announcements")
      setAnnouncements(storedAnnouncements)

      const letters = JSON.parse(localStorage.getItem("acceptanceLetters") || "[]")
      const userLetters = letters.filter((l: any) => l.recipientEmail === user.email && l.schoolId === schoolId)
      setAcceptanceLetters(userLetters)

      setAcademicTips(getAcademicAdvice("student", { level: user.level, department: user.department }))
      setIsLoaded(true)
    }

    loadData()
  }, [])

  const approvedGrades = grades.filter((g) => g.status === "approved")
  const avgScore = approvedGrades.length > 0 ? approvedGrades.reduce((acc, g) => acc + g.score, 0) / approvedGrades.length : 0

  const handleAddComment = async (announcementId: string) => {
    const comment = commentText[announcementId]
    if (!comment || !comment.trim()) return
    const user = JSON.parse(localStorage.getItem("user") || "{}")

    const announcement = announcements.find(a => a.id === announcementId)
    if (!announcement) return

    const newComment = { id: Date.now().toString(), author: user.fullName || "Student", text: comment, date: new Date().toISOString() }
    const updatedComments = [...(announcement.comments || []), newComment]

    await db.update("announcements", announcementId, { comments: updatedComments }, "announcements")

    setAnnouncements(prev => prev.map(ann => ann.id === announcementId ? { ...ann, comments: updatedComments } : ann))
    setCommentText({ ...commentText, [announcementId]: "" })
  }

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "grades", label: "My Grades", icon: <Award className="h-5 w-5" />, badge: grades.filter((g) => g.status === "pending").length },
    { id: "materials", label: "Study Materials", icon: <FileText className="h-5 w-5" />, badge: materials.length },
    { id: "subjects", label: "My Subjects", icon: <BookOpen className="h-5 w-5" />, badge: assignedSubjects.length },
    { id: "announcements", label: "Announcements", icon: <MessageSquare className="h-5 w-5" />, badge: announcements.length },
    { id: "complaints", label: "Submit Complaint", icon: <MessageCircle className="h-5 w-5" /> },
  ]

  if (!isLoaded) {
    return (
      <DashboardLayout role="student" sidebarItems={sidebarItems} activeSection={activeSection} onSectionChange={setActiveSection}>
        <div className="flex items-center justify-center py-12"><div className="animate-pulse">Loading dashboard...</div></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="student" sidebarItems={sidebarItems} activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="space-y-6">

        {/* OVERVIEW */}
        {activeSection === "overview" && (
          <>
            {currentUser && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />{currentUser.fullName}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <Badge variant="outline">{currentUser.level}</Badge>
                      {currentUser.department && <Badge>{currentUser.department} Department</Badge>}
                      <span className="text-sm">Student ID: {currentUser.generatedId}</span>
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
                    AI Study Buddy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {academicTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground bg-card p-3 rounded-lg border border-border/50">
                        <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                        <p>{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Average Score</CardTitle><TrendingUp className="h-4 w-4 text-primary" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{avgScore.toFixed(1)}%</div><p className="text-xs text-muted-foreground">Across {approvedGrades.length} subjects</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Grades</CardTitle><Award className="h-4 w-4 text-primary" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{grades.length}</div><p className="text-xs text-muted-foreground">{grades.filter((g) => g.status === "pending").length} pending</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Study Materials</CardTitle><BookOpen className="h-4 w-4 text-primary" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{materials.length}</div><p className="text-xs text-muted-foreground">Available resources</p></CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">Recent Announcements</CardTitle>
                    <CardDescription>Latest updates from the school</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveSection("announcements")}>View All</Button>
                </CardHeader>
                <CardContent>
                  {announcements.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">No recent announcements.</div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.slice(0, 3).map((announcement) => (
                        <div key={announcement.id} className="border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm line-clamp-1">{announcement.title}</h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{announcement.date}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{announcement.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">Recent Grades</CardTitle>
                    <CardDescription>Your latest assessment results</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveSection("grades")}>View All</Button>
                </CardHeader>
                <CardContent>
                  {grades.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">No recent grades.</div>
                  ) : (
                    <div className="space-y-4">
                      {grades.slice(0, 4).map((grade) => (
                        <div key={grade.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-sm">{grade.subject}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={grade.status === "approved" ? "default" : "secondary"} className="text-[10px]">{grade.status}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{grade.grade}</span>
                            <span className="text-xs text-muted-foreground ml-1">({grade.score}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

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

        {/* GRADES */}
        {activeSection === "grades" && (
          <Card>
            <CardHeader><CardTitle>My Grades</CardTitle><CardDescription>View your academic performance</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><h3 className="font-medium">{grade.subject}</h3><Badge variant={grade.status === "approved" ? "default" : "secondary"}>{grade.status}</Badge></div>
                      <p className="text-sm text-muted-foreground">{grade.semester}</p>
                    </div>
                    <div className="text-right"><div className="text-2xl font-bold">{grade.grade}</div><p className="text-sm text-muted-foreground">{grade.score}%</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STUDY MATERIALS */}
        {activeSection === "materials" && (
          <Card>
            <CardHeader><CardTitle>Study Materials</CardTitle><CardDescription>Download course materials and resources</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><h3 className="font-medium">{material.title}</h3><Badge variant="outline">{material.type}</Badge></div>
                      <p className="text-sm text-muted-foreground">{material.subject} | Uploaded by {material.uploadedBy} | {material.date}</p>
                    </div>
                    <Button size="sm" variant="ghost"><Download className="h-4 w-4 mr-2" />Download</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* MY SUBJECTS */}
        {activeSection === "subjects" && (
          <Card>
            <CardHeader>
              <CardTitle>My Subjects</CardTitle>
              <CardDescription>Subjects assigned based on {currentUser?.level}{currentUser?.department ? ` - ${currentUser.department} Department` : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedSubjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No subjects assigned yet.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {assignedSubjects.map((subject) => (
                    <div key={subject.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div><h4 className="font-medium">{subject.name}</h4><p className="text-xs text-muted-foreground mt-1">{subject.code}</p></div>
                        {subject.isCore && <Badge variant="outline" className="text-xs">Core</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ANNOUNCEMENTS */}
        {activeSection === "announcements" && (
          <Card>
            <CardHeader><CardTitle>Announcements</CardTitle><CardDescription>Stay updated with school news and important information</CardDescription></CardHeader>
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground"><MessageSquare className="h-4 w-4" /><span>{announcement.comments?.length || 0} comments</span></div>
                        {announcement.comments?.map((comment: any) => (
                          <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-start justify-between"><span className="font-medium text-sm">{comment.author}</span><span className="text-xs text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</span></div>
                            <p className="text-sm mt-1">{comment.text}</p>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Textarea placeholder="Add a comment..." value={commentText[announcement.id] || ""} onChange={(e) => setCommentText({ ...commentText, [announcement.id]: e.target.value })} className="min-h-[60px]" />
                          <Button size="icon" onClick={() => handleAddComment(announcement.id)}><Send className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* COMPLAINTS */}
        {activeSection === "complaints" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" />Submit a Complaint</CardTitle>
              <CardDescription>Your complaint will be reviewed confidentially by the principal only.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/complaint-bot"><Button className="w-full">Open Complaint Assistant</Button></Link>
            </CardContent>
          </Card>
        )}

      </div>
      <AIAssistant userRole="student" context={{ level: currentUser?.level, department: currentUser?.department }} />
    </DashboardLayout>
  )
}
