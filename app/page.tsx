import Link from "next/link";
import { ArrowRight, GraduationCap, User } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="z-10 text-center max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 pb-2">
          NextGen Quiz Platform
        </h1>
        <p className="text-xl md:text-2xl text-slate-300">
          AI-powered quiz generation with efficiency-based scoring.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
          <Link href="/professor" className="group relative px-8 py-4 bg-slate-900 border border-slate-700 rounded-2xl hover:border-blue-500/50 transition-all hover:scale-105 shadow-xl hover:shadow-blue-500/20 overflow-hidden flex items-center justify-between">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Professor Portal</h2>
                <p className="text-sm text-slate-400">Generate quizzes with AI</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 ml-6 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <div className="opacity-50 cursor-not-allowed group relative px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400/50">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-400">Student Portal</h2>
                <p className="text-sm text-slate-500">Requires a Quiz Link</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
