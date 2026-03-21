"use client";

import { useState } from "react";
import { Loader2, Sparkles, Copy, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ProfessorPortal() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizId, setQuizId] = useState("");
  const [hostUrl, setHostUrl] = useState("");
  const [studentUrl, setStudentUrl] = useState("");
  const [hostToken, setHostToken] = useState("");
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedStudent, setCopiedStudent] = useState(false);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setQuizId("");
    setHostUrl("");
    setHostToken("");
    setStudentUrl("");
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: topic })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Failed to generate quiz (Network error)");
      }
      
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate quiz");
      }
      
      let origin = typeof window !== "undefined" ? window.location.origin : "";
      if (origin.includes("localhost")) {
        try {
          const ipRes = await fetch("/api/ip");
          const { ip } = await ipRes.json();
          if (ip && ip !== "localhost") {
            origin = origin.replace("localhost", ip);
          }
        } catch (e) {}
      }
      setQuizId(data.quizId);
      setHostToken(data.hostToken);
      setHostUrl(`${origin}/quiz/${data.quizId}/host?token=${data.hostToken}`);
      setStudentUrl(`${origin}/quiz/${data.quizId}`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyHostUrl = () => {
    navigator.clipboard.writeText(hostUrl);
    setCopiedHost(true);
    setTimeout(() => setCopiedHost(false), 2000);
  };

  const copyStudentUrl = () => {
    navigator.clipboard.writeText(studentUrl);
    setCopiedStudent(true);
    setTimeout(() => setCopiedStudent(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
           <h2 className="text-2xl font-bold mb-6">Professor Access</h2>
           <input 
             type="password" 
             placeholder="Enter PIN..." 
             autoFocus
             value={pin}
             onChange={(e) => setPin(e.target.value)}
             className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-center mb-6 focus:outline-none focus:border-indigo-500"
           />
           <button 
             onClick={() => {
               if (pin === process.env.NEXT_PUBLIC_PROFESSOR_PIN) setIsAuthenticated(true);
               else alert("Incorrect PIN!");
             }} 
             className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition-all"
           >
             Unlock Dashboard
           </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 p-6 md:p-12 text-slate-100 flex justify-center">
      <div className="max-w-4xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Professor Portal
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Paste your topic, syllabus, or study notes below to generate an AI-powered quiz.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., The French Revolution, Quantum Mechanics, or paste your syllabus..."
            className="w-full h-64 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y relative z-10 text-lg shadow-inner"
          />

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 relative z-10">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end relative z-10">
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all flex items-center gap-3 overflow-hidden shadow-lg hover:shadow-blue-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Generate Quiz
                </>
              )}
            </button>
          </div>
        </div>

        {quizId && (
          <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-3xl p-8 animate-in fade-in zoom-in-95 duration-500 shadow-2xl space-y-6">
            <h3 className="text-xl font-semibold text-indigo-200 mb-2">Quiz Generated Successfully!</h3>
            
            {/* Host Link Section */}
            <div>
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 block">1. Host Link (For your screen)</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-center overflow-x-auto text-slate-300">
                  <code className="whitespace-nowrap">{hostUrl}</code>
                </div>
                <button
                  onClick={copyHostUrl}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  {copiedHost ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copiedHost ? "Copied!" : "Copy Link"}
                </button>
                <Link
                  href={`/quiz/${quizId}/host?token=${hostToken}`}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  Go to Host Dashboard
                </Link>
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* Student Link Section */}
            <div>
              <label className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2 block">2. Student Join Link (Share this with class)</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-slate-950 border border-emerald-900/50 rounded-xl px-4 py-3 flex items-center overflow-x-auto text-emerald-200">
                  <code className="whitespace-nowrap">{studentUrl}</code>
                </div>
                <button
                  onClick={copyStudentUrl}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  {copiedStudent ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copiedStudent ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
