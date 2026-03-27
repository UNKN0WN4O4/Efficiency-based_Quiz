import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { topic, questions } = await req.json();

    if (!topic || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Missing topic or questions" }, { status: 400 });
    }

    const generatedToken = Math.random().toString(36).substring(2, 12);
    
    // Save to Firebase
    const docRef = await addDoc(collection(db, "quizzes"), {
      createdAt: new Date().toISOString(),
      topicText: topic.substring(0, 500),
      questions: questions,
      status: "waiting", // 'waiting', 'active', 'finished'
      currentQuestionIndex: 0,
      questionStartTime: 0,
      hostToken: generatedToken,
    });

    return NextResponse.json({ quizId: docRef.id, questions, hostToken: generatedToken });

  } catch (error: any) {
    console.error("Create API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create quiz" }, { status: 500 });
  }
}
