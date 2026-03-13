/**
 * Integration tests for complete registration workflow
 */

describe("School Registration Flow", () => {
  it("should complete full registration workflow", async () => {
    // Step 1: Register school
    const schoolData = {
      name: "Integration Test School",
      type: "private",
      location: "Freetown",
      address: "456 Test Avenue",
      phone: "+232 99 888 777",
      email: "integration@test.edu.sl",
      principalName: "Jane Principal",
    }

    const registrationResponse = await fetch("http://localhost:3000/api/schools/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(schoolData),
    })
    const registrationData = await registrationResponse.json()

    expect(registrationData.success).toBe(true)
    expect(registrationData.data.principalId).toBeDefined()
    expect(registrationData.data.principalPassword).toBeDefined()

    // Step 2: Verify credentials are generated
    const { principalId, principalPassword } = registrationData.data
    expect(principalId).toMatch(/^PRIN\d{9}$/)
    expect(principalPassword.length).toBeGreaterThanOrEqual(10)

    // Step 3: Verify school can be retrieved
    const schoolId = registrationData.data.id
    const schoolResponse = await fetch(`http://localhost:3000/api/schools/${schoolId}`)
    const schoolInfo = await schoolResponse.json()

    expect(schoolInfo.success).toBe(true)
    expect(schoolInfo.data.id).toBe(schoolId)
  })

  it("should handle concurrent registrations", async () => {
    const schoolData = {
      name: "Concurrent Test School",
      type: "government",
      location: "Bo",
      address: "789 Parallel Road",
      phone: "+232 77 666 555",
      email: "concurrent@test.edu.sl",
      principalName: "Bob Concurrent",
    }

    const promises = Array(3)
      .fill(null)
      .map(() =>
        fetch("http://localhost:3000/api/schools/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(schoolData),
        }).then((r) => r.json()),
      )

    const results = await Promise.all(promises)

    // All should succeed
    results.forEach((result) => {
      expect(result.success).toBe(true)
    })

    // All should have unique IDs
    const ids = results.map((r) => r.data.principalId)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})
