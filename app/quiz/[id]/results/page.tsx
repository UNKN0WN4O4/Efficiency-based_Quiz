"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, Clock, Lightbulb, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function ResultsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const attemptId = searchParams?.get("attemptId");

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAttempt() {
      if (!id || !attemptId) {
        setError("Missing quiz or attempt ID");
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, `quizzes/${id}/attempts`, attemptId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAttempt(docSnap.data());
        } else {
          setError("Results not found");
        }
      } catch (err: any) {
        setError("Error loading results");
      } finally {
        setLoading(false);
      }
    }
    fetchAttempt();
  }, [id, attemptId]);

  if (loading) return <div className="text-white flex items-center justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-blue-500" /></div>;
  if (error || !attempt) return <div className="text-white flex items-center justify-center text-xl text-red-400 py-20">{error}</div>;

  return (
    <div className="max-w-2xl w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full mb-8 shadow-xl shadow-blue-500/30">
          <Trophy className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
          Quiz Complete!
        </h1>
        <p className="text-xl text-slate-400 mb-10">Here is your Efficiency Score breakdown.</p>

        <div className="bg-slate-950/50 rounded-3xl p-8 mb-8 border border-slate-800/50 backdrop-blur-sm">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Final Efficiency Score</div>
          <div className="text-6xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
            {attempt.score} <span className="text-3xl text-slate-600">pts</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="bg-blue-500/20 p-4 rounded-xl text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{attempt.timeTakenSeconds}s</div>
              <div className="text-sm text-slate-500">Total Time Spent</div>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
            <div className="bg-yellow-500/20 p-4 rounded-xl text-yellow-400">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{attempt.hintsUsed}</div>
              <div className="text-sm text-slate-500">Hints Used</div>
            </div>
          </div>
        </div>

        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-slate-200">
      <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-blue-500" /></div>}>
        <ResultsContent />
      </Suspense>
    </main>
  );
}
