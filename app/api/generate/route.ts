import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.ARRAY,
  description: "List of multiple-choice questions",
  items: {
    type: Type.OBJECT,
    properties: {
      question_text: {
        type: Type.STRING,
        description: "The question text",
      },
      options: {
        type: Type.ARRAY,
        description: "Array of exactly 4 possible answers",
        items: {
          type: Type.STRING,
        },
      },
      correct_answer: {
        type: Type.STRING,
        description: "The exact correct answer from the options array",
      },
      hint: {
         type: Type.STRING,
         description: "A helpful hint for the student",
      }
    },
    required: ["question_text", "options", "correct_answer", "hint"],
  },
};

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input) {
      return NextResponse.json({ error: "Missing input text" }, { status: 400 });
    }

    const prompt = `Generate 10 multiple-choice questions based on the following text: ${input}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const quizDataString = response.text;
    if (!quizDataString) {
      throw new Error("No response from Gemini");
    }

    const questions = JSON.parse(quizDataString);

    const generatedToken = Math.random().toString(36).substring(2, 12);
    
    // Save to Firebase
    const docRef = await addDoc(collection(db, "quizzes"), {
      createdAt: new Date().toISOString(),
      topicText: input.substring(0, 500),
      questions: questions,
      status: "waiting", // 'waiting', 'active', 'finished'
      currentQuestionIndex: 0,
      questionStartTime: 0,
      hostToken: generatedToken,
    });

    return NextResponse.json({ quizId: docRef.id, questions, hostToken: generatedToken });

  } catch (error: any) {
    console.error("Generate API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
  }
}
