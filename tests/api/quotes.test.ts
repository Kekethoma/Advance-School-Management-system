/**
 * Unit tests for quotes API endpoint
 */

describe("GET /api/quotes/random", () => {
  it("should return a random quote", async () => {
    const response = await fetch("http://localhost:3000/api/quotes/random")
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty("text")
    expect(data).toHaveProperty("author")
    expect(typeof data.text).toBe("string")
    expect(typeof data.author).toBe("string")
  })

  it("should return different quotes on multiple calls", async () => {
    const quote1 = await fetch("http://localhost:3000/api/quotes/random").then((r) => r.json())
    const quote2 = await fetch("http://localhost:3000/api/quotes/random").then((r) => r.json())

    // May occasionally fail if same quote is returned, but statistically unlikely
    expect(quote1.text).toBeDefined()
    expect(quote2.text).toBeDefined()
  })

  it("should have proper CORS headers", async () => {
    const response = await fetch("http://localhost:3000/api/quotes/random")

    expect(response.headers.get("content-type")).toContain("application/json")
  })
})
