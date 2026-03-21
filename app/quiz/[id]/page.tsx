"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, onSnapshot, collection, addDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculateScore } from "@/lib/scoring";
import { Square, Circle, Triangle, Hexagon, Loader2, Lightbulb, AlertTriangle, Clock, CheckCircle } from "lucide-react";

export default function StudentLiveQuiz() {
  const params = useParams();
  const id = params?.id as string;
  
  const [name, setName] = useState("");
  const [playerId, setPlayerId] = useState("");
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [confidence, setConfidence] = useState(50);
  const [showHint, setShowHint] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answeredIndex, setAnsweredIndex] = useState(-1);
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (quiz?.status === "active") {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - quiz.questionStartTime) / 1000);
        setTimeLeft(Math.max(0, 30 - elapsed));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [quiz?.status, quiz?.questionStartTime]);

  useEffect(() => {
    const stored = localStorage.getItem(`quiz_${id}_player`);
    if (stored) setPlayerId(stored);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "quizzes", id), (docSnap) => {
      if (docSnap.exists()) {
         const data = docSnap.data();
         setQuiz(data);
         if (data.currentQuestionIndex !== answeredIndex) {
            setHasAnswered(false);
            setShowHint(false);
            setConfidence(50);
         }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id, answeredIndex]);

  useEffect(() => {
    if (!id || !playerId) return;
    const unsub = onSnapshot(doc(db, `quizzes/${id}/players`, playerId), (docSnap) => {
      if (docSnap.exists()) {
        setMyScore(docSnap.data().score || 0);
      }
    });
    return () => unsub();
  }, [id, playerId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const pRef = await addDoc(collection(db, `quizzes/${id}/players`), {
        name,
        score: 0,
        joinedAt: Date.now()
      });
      setPlayerId(pRef.id);
      localStorage.setItem(`quiz_${id}_player`, pRef.id);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAnswer = async (optionIndex: number) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setAnsweredIndex(quiz.currentQuestionIndex);

    const currentQ = quiz.questions[quiz.currentQuestionIndex];
    const timeTakenMs = Date.now() - quiz.questionStartTime;
    
    const isCorrect = currentQ.options[optionIndex] === currentQ.correct_answer;
    
    const { score } = calculateScore(isCorrect, timeTakenMs, showHint, confidence);

    try {
       await updateDoc(doc(db, `quizzes/${id}/players`, playerId), {
         score: increment(score)
       });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex justify-center items-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;
  if (!quiz) return <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center">Quiz not found or not created yet.</div>;

  if (!playerId) {
    return (
      <main className="min-h-screen bg-slate-950 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] p-6 flex flex-col items-center justify-center text-slate-100">
        <form onSubmit={handleJoin} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
           <h1 className="text-3xl font-extrabold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Join Quiz</h1>
           <input 
             type="text" 
             placeholder="Enter your name..." 
             autoFocus
             value={name}
             onChange={(e) => setName(e.target.value)}
             className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-xl text-center mb-6 focus:outline-none focus:border-indigo-500 shadow-inner"
           />
           <button type="submit" disabled={!name} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xl rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25">
             Enter
           </button>
        </form>
      </main>
    );
  }

  if (quiz.status === "waiting" || !quiz.status) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6 text-center">
        <div className="absolute top-10 right-10 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl font-bold font-mono text-indigo-400">Score: {myScore}</div>
        <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-6 drop-shadow-md">
          You're in!
        </h2>
        <p className="text-xl text-slate-400 animate-pulse font-medium">Look at the screen. Waiting for professor to start...</p>
      </main>
    );
  }

  if (quiz.status === "finished") {
    return (
      <main className="min-h-screen bg-slate-950 p-6 flex flex-col text-slate-100 items-center overflow-y-auto">
        <h2 className="text-5xl md:text-6xl font-extrabold text-yellow-400 mt-10 mb-8 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)] text-center">Quiz Finished!</h2>
        <div className="bg-slate-900 border border-slate-800 p-10 md:p-12 rounded-3xl shadow-2xl mb-12 flex flex-col items-center text-center">
           <p className="text-xl md:text-2xl text-slate-400 mb-4 font-semibold">Your Final Score</p>
           <p className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{myScore}</p>
        </div>
        
        <div className="w-full max-w-4xl space-y-6 pb-20">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center justify-center gap-3 mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            Correct Answers Review
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quiz.questions.map((q: any, index: number) => (
              <div key={index} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col h-full">
                <p className="text-lg font-bold text-slate-200 mb-4 flex-1">{index + 1}. {q.question_text}</p>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-auto">
                  <p className="text-emerald-400 font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" /> {q.correct_answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (hasAnswered) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6 text-center">
        <div className="absolute top-6 right-6 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl font-bold font-mono text-indigo-400">Score: {myScore}</div>
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 mx-auto animate-pulse">
           <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
        </div>
        <h2 className="text-4xl font-bold text-slate-100 mb-4">Answer Submitted!</h2>
        <p className="text-xl text-slate-400">Waiting for other players...</p>
      </main>
    );
  }

  const shapes = [
    { Icon: Square, color: "bg-red-500 hover:bg-red-400 border-red-700" },
    { Icon: Circle, color: "bg-blue-500 hover:bg-blue-400 border-blue-700" },
    { Icon: Triangle, color: "bg-yellow-500 hover:bg-yellow-400 border-yellow-700" },
    { Icon: Hexagon, color: "bg-emerald-500 hover:bg-emerald-400 border-emerald-700" }
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 flex flex-col items-center justify-center text-slate-100">
      <div className="w-full max-w-lg mb-4 bg-slate-900 mx-4 rounded-b-3xl shadow-2xl z-10 sticky top-0 border-b border-x border-slate-800 overflow-hidden">
        {/* Timer Progress Bar */}
        <div className="w-full bg-slate-800 h-2">
          <div 
            className={`h-full transition-all duration-500 ease-linear ${timeLeft <= 10 ? 'bg-red-500' : 'bg-indigo-500'}`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/50">
             <div className="flex items-center gap-4">
               <span className="font-bold text-slate-400 text-lg">Q{quiz.currentQuestionIndex + 1}</span>
               <span className={`flex items-center gap-1 font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                 <Clock className="w-4 h-4" /> 00:{timeLeft.toString().padStart(2, '0')}
               </span>
             </div>
             <span className="font-black text-2xl text-indigo-400">{myScore} pts</span>
          </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-semibold flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${confidence >= 80 ? 'text-green-400' : confidence <= 30 ? 'text-red-400' : 'text-orange-400'}`} />
              Confidence
            </label>
            <button
              onClick={() => setShowHint(true)}
              disabled={showHint}
              className="text-sm font-bold flex items-center gap-2 text-yellow-500 hover:text-yellow-400 disabled:opacity-50 transition-colors bg-yellow-500/10 px-4 py-2 rounded-xl"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? "Hint (-20%)" : "Need Hint?"}
            </button>
          </div>
          
          <div className="relative pt-2">
            <input
              type="range"
              min="1"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full h-4 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs font-bold text-slate-500 mt-3 px-1">
              <span>Guess</span>
              <span className="text-indigo-400">{confidence}%</span>
              <span>Certain</span>
            </div>
          </div>

          {showHint && (
            <div className="p-4 mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200/90 text-sm animate-in fade-in">
              <strong className="text-yellow-400 block mb-1">Hint:</strong> 
              {quiz.questions[quiz.currentQuestionIndex].hint}
            </div>
          )}
        </div>
      </div>
    </div>

      <div className="grid grid-cols-2 gap-4 w-full h-full p-4 flex-1 pb-10">
         {shapes.map((s, idx) => {
            const Icon = s.Icon;
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`${s.color} border-b-[12px] rounded-3xl flex items-center justify-center transform active:translate-y-3 active:border-b-0 transition-all shadow-xl min-h-[150px]`}
              >
                <Icon className="w-24 h-24 text-white fill-white/80 drop-shadow-md" />
              </button>
            )
         })}
      </div>
    </main>
  );
}
