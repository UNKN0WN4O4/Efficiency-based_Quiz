"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { doc, onSnapshot, updateDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Play, ChevronRight, Trophy, Square, Circle, Triangle, Hexagon, Loader2, Lock, CheckCircle, Clock } from "lucide-react";

function HostDashboardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const token = searchParams?.get("token");
  
  const [quiz, setQuiz] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localIp, setLocalIp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    fetch("/api/ip").then(res => res.json()).then(data => setLocalIp(data.ip)).catch(() => {});
  }, []);

  useEffect(() => {
    let isNavigating = false;
    if (quiz?.status === "active") {
      const interval = setInterval(async () => {
        if (isNavigating) return;
        const elapsed = Math.floor((Date.now() - quiz.questionStartTime) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          isNavigating = true;
          const nextIdx = quiz.currentQuestionIndex + 1;
          if (nextIdx >= quiz.questions.length) {
            await updateDoc(doc(db, "quizzes", id), { status: "finished" });
          } else {
            await updateDoc(doc(db, "quizzes", id), {
              currentQuestionIndex: nextIdx,
              questionStartTime: Date.now()
            });
          }
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [quiz?.status, quiz?.questionStartTime, quiz?.currentQuestionIndex, id, quiz?.questions?.length]);

  useEffect(() => {
    if (!id) return;
    
    const unsubQuiz = onSnapshot(doc(db, "quizzes", id), (docSnap) => {
      if (docSnap.exists()) {
        setQuiz(docSnap.data());
      }
      setLoading(false);
    });

    const unsubPlayers = onSnapshot(collection(db, `quizzes/${id}/players`), (snapshot) => {
      const p: any[] = [];
      snapshot.forEach(d => {
        p.push({ id: d.id, ...d.data() });
      });
      // Sort players by score descending
      p.sort((a, b) => (b.score || 0) - (a.score || 0));
      setPlayers(p);
    });

    return () => {
      unsubQuiz();
      unsubPlayers();
    };
  }, [id]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex justify-center items-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  if (!quiz) return <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center">Quiz not found</div>;

  if (quiz.hostToken && quiz.hostToken !== token) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 flex flex-col justify-center items-center text-center p-6">
        <Lock className="w-16 h-16 mb-6 text-red-500/50" />
        <h2 className="font-bold text-3xl mb-2">Access Denied</h2>
        <p className="text-slate-400">Invalid or missing Host Token. Please use the exact Host Link generated from the Professor Portal.</p>
      </div>
    );
  }

  const handleStart = async () => {
    await updateDoc(doc(db, "quizzes", id), {
      status: "active",
      currentQuestionIndex: 0,
      questionStartTime: Date.now()
    });
  };

  const handleNext = async () => {
    const nextIdx = quiz.currentQuestionIndex + 1;
    if (nextIdx >= quiz.questions.length) {
      // End Quiz
      await updateDoc(doc(db, "quizzes", id), {
        status: "finished"
      });
    } else {
      await updateDoc(doc(db, "quizzes", id), {
        currentQuestionIndex: nextIdx,
        questionStartTime: Date.now()
      });
    }
  };

  // Status: waiting
  if (quiz.status === "waiting" || !quiz.status) {
    let origin = typeof window !== "undefined" ? window.location.origin : "";
    if (origin.includes("localhost") && localIp) {
      origin = origin.replace("localhost", localIp);
    }
    return (
      <main className="min-h-screen bg-slate-950 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] p-6 flex flex-col items-center justify-center text-slate-100">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
          Students, join at:
        </h1>
        <div className="bg-emerald-900/40 border-2 border-emerald-500 text-emerald-400 px-8 py-4 rounded-3xl text-3xl md:text-5xl font-black mb-12 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
          {origin}/quiz/{id}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-2xl w-full shadow-2xl text-center">
          <Users className="w-16 h-16 mx-auto text-indigo-500 mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold mb-2">{players.length} Players Waiting</h2>
          <p className="text-slate-400 mb-10">Waiting for everyone to get in...</p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-10 min-h-[100px] content-start">
            {players.length === 0 && <span className="text-slate-600 italic">No one is here yet.</span>}
            {players.map(p => (
              <span key={p.id} className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl font-bold text-indigo-300 shadow-md">
                {p.name}
              </span>
            ))}
          </div>

          <button onClick={handleStart} className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-bold rounded-2xl flex items-center gap-3 mx-auto transition-transform hover:scale-105 shadow-xl hover:shadow-indigo-500/25">
            <Play className="w-6 h-6 fill-white" /> Start Quiz Now
          </button>
        </div>
      </main>
    );
  }

  // Status: active
  if (quiz.status === "active") {
    const currentQ = quiz.questions[quiz.currentQuestionIndex];
    if (!currentQ) return null;

    const shapes = [
      { Icon: Square, color: "bg-red-500 border-red-400/50" },
      { Icon: Circle, color: "bg-blue-500 border-blue-400/50" },
      { Icon: Triangle, color: "bg-yellow-500 border-yellow-400/50" },
      { Icon: Hexagon, color: "bg-emerald-500 border-emerald-400/50" }
    ];

    return (
      <main className="min-h-screen bg-slate-950 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] p-6 flex flex-col text-slate-100">
        <div className="flex justify-between items-center mb-10 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl border-t-4 border-t-indigo-500">
           <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
             Question {quiz.currentQuestionIndex + 1} <span className="text-slate-600">/</span> {quiz.questions.length}
           </div>
           
           {/* Timer Display */}
           <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-2xl tracking-widest ${timeLeft <= 10 ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-slate-800/80 text-emerald-400 border border-slate-700'}`}>
             <Clock className={`w-8 h-8 ${timeLeft <= 10 ? 'text-red-400' : 'text-emerald-400'}`} />
             00:{timeLeft.toString().padStart(2, '0')}
           </div>

           <button onClick={handleNext} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 font-bold text-lg rounded-2xl flex items-center gap-2 transition-transform hover:scale-105 shadow-lg">
             Skip <ChevronRight className="w-6 h-6" />
           </button>
        </div>

        {/* Progress Bar for Timer */}
        <div className="w-full bg-slate-800 h-2 rounded-full mb-8 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-linear ${timeLeft <= 10 ? 'bg-red-500' : 'bg-indigo-500'}`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-8 leading-tight whitespace-pre-wrap px-4">
            {currentQ.question_text}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4">
            {currentQ.options.map((opt: string, i: number) => {
              const shape = shapes[i % shapes.length];
              const ShapeIcon = shape.Icon;
              return (
                <div key={i} className={`${shape.color} border-4 p-5 md:p-6 rounded-3xl shadow-lg flex items-center gap-6 transform transition-transform hover:scale-[1.02]`}>
                  <ShapeIcon className="w-12 h-12 text-white shrink-0 fill-white" />
                  <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-md leading-tight">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // Status: finished
  return (
    <main className="min-h-screen bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 p-6 flex flex-col items-center justify-center text-slate-100">
       <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-3xl w-full shadow-2xl text-center">
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-10">
            Final Leaderboard
          </h1>

          <div className="space-y-4 text-left">
            {players.length === 0 ? <p className="text-center text-slate-500 text-xl font-medium">No players joined.</p> : null}
            {players.map((p, i) => (
              <div key={p.id} className={`flex justify-between items-center bg-slate-950 border ${i === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : i === 1 ? 'border-zinc-400/50' : i === 2 ? 'border-amber-700/50' : 'border-slate-800'} p-6 rounded-2xl`}>
                <div className="flex items-center gap-6">
                  <span className={`text-3xl font-black ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-600' : 'text-slate-600'}`}>
                    #{i + 1}
                  </span>
                  <span className="text-2xl font-bold text-slate-100">{p.name || 'Anonymous'}</span>
                </div>
                <div className="text-3xl font-black text-indigo-400">
                  {p.score || 0} <span className="text-lg font-medium text-slate-500 uppercase">pts</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-left w-full space-y-6 border-t border-slate-800 pt-10">
            <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              Correct Answers Review
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quiz.questions.map((q: any, index: number) => (
                <div key={index} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <div className="flex items-start gap-4 mb-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <p className="text-lg font-semibold text-slate-200 leading-snug">{q.question_text}</p>
                  </div>
                  <div className="ml-12 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-emerald-400 font-bold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" /> 
                      {q.correct_answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
       </div>
    </main>
  );
}

export default function HostDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>}>
      <HostDashboardContent />
    </Suspense>
  );
}
