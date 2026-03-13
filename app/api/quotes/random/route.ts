import { NextResponse } from "next/server"

// Educational quotes database with AI-generated content
const quotes = [
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
  },
  {
    text: "The function of education is to teach one to think intensively and to think critically. Intelligence plus character - that is the goal of true education.",
    author: "Martin Luther King Jr.",
  },
  {
    text: "Education is not preparation for life; education is life itself.",
    author: "John Dewey",
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    author: "Malcolm X",
  },
  {
    text: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch",
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
  },
  {
    text: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle",
  },
  {
    text: "Education is the key to unlocking the world, a passport to freedom.",
    author: "Oprah Winfrey",
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
]

export async function GET() {
  // Randomly select a quote
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

  // Simulate API delay for realism
  await new Promise((resolve) => setTimeout(resolve, 100))

  return NextResponse.json(randomQuote)
}
