/**
 * Unit tests for schools API endpoints
 */

describe("POST /api/schools/register", () => {
  const mockSchoolData = {
    name: "Test High School",
    type: "government",
    location: "Freetown",
    address: "123 Test Street",
    phone: "+232 12 345 678",
    email: "test@school.edu.sl",
    principalName: "John Test",
  }

  it("should register a new school", async () => {
    const response = await fetch("http://localhost:3000/api/schools/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockSchoolData),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty("principalId")
    expect(data.data).toHaveProperty("principalPassword")
    expect(data.data.principalId).toMatch(/^PRIN\d{9}$/)
    expect(data.message).toBe("School registered successfully")
  })

  it("should generate unique principal IDs", async () => {
    const response1 = await fetch("http://localhost:3000/api/schools/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockSchoolData),
    }).then((r) => r.json())

    const response2 = await fetch("http://localhost:3000/api/schools/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockSchoolData),
    }).then((r) => r.json())

    expect(response1.data.principalId).not.toBe(response2.data.principalId)
  })

  it("should handle invalid data gracefully", async () => {
    const response = await fetch("http://localhost:3000/api/schools/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: "data" }),
    })

    expect(response.status).toBe(500)
  })
})

describe("GET /api/schools/[id]", () => {
  it("should return school data by ID", async () => {
    const response = await fetch("http://localhost:3000/api/schools/test-id")
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty("id")
  })
})
