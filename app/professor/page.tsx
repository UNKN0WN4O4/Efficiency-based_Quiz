"use client";

import { useState, useEffect } from "react";
import { Loader2, PlusCircle, Trash2, Copy, CheckCircle, Play, BookOpen, Clock, Settings, FileText } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";

interface Question {
  question_text: string;
  options: string[];
  correct_answer: string;
  hint: string;
}

export default function ProfessorPortal() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [savedQuizzes, setSavedQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question_text: "", options: ["", "", "", ""], correct_answer: "", hint: "" }
  ]);
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
  const [localIp, setLocalIp] = useState("");

  useEffect(() => {
    fetch("/api/ip").then(res => res.json()).then(data => setLocalIp(data.ip)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    setLoadingQuizzes(true);
    const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qz: any[] = [];
      snapshot.forEach((docSnap) => {
        qz.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSavedQuizzes(qz);
      setLoadingQuizzes(false);
    });
    
    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleDeleteQuiz = async (id: string) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      await deleteDoc(doc(db, "quizzes", id));
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: "", options: ["", "", "", ""], correct_answer: "", hint: "" }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | string[]) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const getBaseOrigin = () => {
    let origin = typeof window !== "undefined" ? window.location.origin : "";
    if (origin.includes("localhost") && localIp && localIp !== "localhost") {
      origin = origin.replace("localhost", localIp);
    }
    return origin;
  };

  const handleCreate = async () => {
    if (!topic.trim()) {
      setError("Please put a subject/topic Name.");
      return;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question ${i + 1} has empty text.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          setError(`Question ${i + 1} has an empty option.`);
          return;
        }
      }
      if (!q.correct_answer || !q.options.includes(q.correct_answer)) {
        setError(`Question ${i + 1} does not have a valid correct answer selected.`);
        return;
      }
    }

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
        body: JSON.stringify({ topic, questions })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Failed to create quiz (Network error)");
      }
      
      if (!response.ok) {
        throw new Error(data?.error || "Failed to create quiz");
      }
      
      const origin = getBaseOrigin();
      
      setQuizId(data.quizId);
      setHostToken(data.hostToken);
      setHostUrl(`${origin}/quiz/${data.quizId}/host?token=${data.hostToken}`);
      setStudentUrl(`${origin}/quiz/${data.quizId}`);
      
      // Reset form
      setTopic("");
      setQuestions([{ question_text: "", options: ["", "", "", ""], correct_answer: "", hint: "" }]);
      
      // Auto switch back to list
      setActiveTab('list');
      
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
             onKeyDown={(e) => {
               if (e.key === 'Enter') {
                 if (pin === process.env.NEXT_PUBLIC_PROFESSOR_PIN) setIsAuthenticated(true);
                 else alert("Incorrect PIN!");
               }
             }}
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
      <div className="max-w-5xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Professor Dashboard
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Manage your saved quizzes or create new ones.
            </p>
          </div>
          
          <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0">
             <button 
               onClick={() => setActiveTab('list')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
             >
               <BookOpen className="w-5 h-5" />
               My Quizzes
             </button>
             <button 
               onClick={() => setActiveTab('create')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
             >
               <PlusCircle className="w-5 h-5" />
               Create Quiz
             </button>
          </div>
        </div>

        {activeTab === 'list' && (
          <div className="space-y-6">
            {quizId && (
              <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-3xl p-8 animate-in fade-in zoom-in-95 duration-500 shadow-2xl space-y-6 mb-8">
                <h3 className="text-xl font-semibold text-indigo-200 mb-2">Quiz Created Successfully!</h3>
                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 block">1. Host Link (For your screen)</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-center overflow-x-auto text-slate-300">
                      <code className="whitespace-nowrap">{hostUrl}</code>
                    </div>
                    <button onClick={copyHostUrl} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 shrink-0">
                      {copiedHost ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copiedHost ? "Copied!" : "Copy Link"}
                    </button>
                    <Link href={`/quiz/${quizId}/host?token=${hostToken}`} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center shrink-0">
                      Go to Host Dashboard
                    </Link>
                  </div>
                </div>
                <hr className="border-slate-800" />
                <div>
                  <label className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2 block">2. Student Join Link (Share this with class)</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 bg-slate-950 border border-emerald-900/50 rounded-xl px-4 py-3 flex items-center overflow-x-auto text-emerald-200">
                      <code className="whitespace-nowrap">{studentUrl}</code>
                    </div>
                    <button onClick={copyStudentUrl} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 shrink-0">
                      {copiedStudent ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copiedStudent ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
              {loadingQuizzes ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                  <p>Loading your quizzes...</p>
                </div>
              ) : savedQuizzes.length === 0 ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                  <FileText className="w-16 h-16 text-slate-700 mb-4" />
                  <p className="text-xl mb-6">You haven't created any quizzes yet.</p>
                  <button 
                    onClick={() => setActiveTab('create')}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
                  >
                    Create Your First Quiz
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/50 border-b border-slate-800">
                        <th className="p-6 font-bold text-slate-400 uppercase tracking-wider text-sm">Topic</th>
                        <th className="p-6 font-bold text-slate-400 uppercase tracking-wider text-sm">Questions</th>
                        <th className="p-6 font-bold text-slate-400 uppercase tracking-wider text-sm">Created</th>
                        <th className="p-6 font-bold text-slate-400 uppercase tracking-wider text-sm">Status</th>
                        <th className="p-6 font-bold text-slate-400 uppercase tracking-wider text-sm text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {savedQuizzes.map((quiz) => (
                        <tr key={quiz.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="p-6 font-semibold text-lg text-slate-200">
                            {quiz.topicText || "Untitled Quiz"}
                          </td>
                          <td className="p-6 text-slate-400">
                            {quiz.questions?.length || 0} Questions
                          </td>
                          <td className="p-6 text-slate-400">
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              quiz.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              quiz.status === 'finished' ? 'bg-slate-700 text-slate-300 border border-slate-600' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {quiz.status || 'waiting'}
                            </span>
                          </td>
                          <td className="p-6 flex justify-end gap-3">
                            <Link 
                              href={`/quiz/${quiz.id}/host?token=${quiz.hostToken}`}
                              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/50 rounded-lg flex items-center gap-2 font-semibold transition-all"
                            >
                              <Play className="w-4 h-4" /> Host
                            </Link>
                            <button 
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all"
                              title="Delete Quiz"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 relative overflow-hidden">
            <div>
               <label className="block text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Quiz Topic</label>
               <input
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 placeholder="E.g., Midterm 1, Advanced Physics..."
                 className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-lg shadow-inner"
               />
            </div>

            <div className="space-y-6">
               {questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                     <div className="flex justify-between items-center">
                       <h3 className="text-indigo-400 font-bold">Question {qIndex + 1}</h3>
                       {questions.length > 1 && (
                         <button onClick={() => removeQuestion(qIndex)} className="text-red-400 hover:text-red-300">
                           <Trash2 className="w-5 h-5" />
                         </button>
                       )}
                     </div>
                     
                     <input
                       value={q.question_text}
                       onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                       placeholder="Enter question text..."
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                     />

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                       {q.options.map((opt, optIndex) => (
                          <input
                            key={optIndex}
                            value={opt}
                            onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                       ))}
                     </div>

                     <div className="flex flex-col sm:flex-row gap-4 mt-2">
                       <select
                         value={q.correct_answer}
                         onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                         className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                       >
                         <option value="" disabled>Select Correct Answer...</option>
                         {q.options.map((opt, optIndex) => (
                           opt.trim() !== "" && <option key={optIndex} value={opt}>{opt}</option>
                         ))}
                       </select>
                       
                       <input
                         value={q.hint || ""}
                         onChange={(e) => updateQuestion(qIndex, 'hint', e.target.value)}
                         placeholder="Hint (optional)"
                         className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                       />
                     </div>
                  </div>
               ))}
            </div>

            <button
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 text-slate-400 hover:text-indigo-400 rounded-2xl flex justify-center items-center gap-2 font-bold transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Add Another Question
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all flex items-center gap-3 overflow-hidden shadow-lg hover:shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Save Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
