import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { getSupabase } from "../../lib/supabase";
import { useAetherStore } from "../../store/useAetherStore";

export function FocusProtocol() {
  const { user } = useAetherStore();
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [skill, setSkill] = useState("Coding");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    if (timeLeft === 0) setTimeLeft(duration * 60);
    setIsActive(true);
    setIsComplete(false);
  };

  const handlePause = () => setIsActive(false);

  const handleComplete = async () => {
    setIsActive(false);
    setIsComplete(true);

    if (user?.id) {
      const client = getSupabase();
      if (!client) return;
      
      const xpAmount = duration * 2; // 2 XP per minute
      
      await client.from('zenith_sessions').insert({
        user_id: user.id,
        session_name: sessionName || 'Deep Work',
        duration_minutes: duration,
        skill_category: skill,
        completed_at: new Date().toISOString()
      });

      await client.from('user_xp').upsert({
        user_id: user.id,
        category: skill,
        mode: 'zenith',
        xp_points: xpAmount,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id,category,mode'
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-2xl font-bold text-cyan-400 font-heading tracking-widest mb-2">SESSION COMPLETE</h2>
          <p className="text-white/60 mb-6 font-mono text-xs">+{duration * 2} XP added to {skill}</p>
          <Button onClick={() => { setIsComplete(false); setTimeLeft(duration * 60); }} className="bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/30">
            START NEW SESSION
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 lg:p-8 h-full max-w-2xl mx-auto w-full">
      <div className="w-full flex gap-2 mb-8 mt-2">
        {[25, 52, 90].map(m => (
          <Button 
            key={m} 
            variant="ghost" 
            onClick={() => { setDuration(m); setTimeLeft(m * 60); setIsActive(false); }}
            className={`flex-1 text-[10px] font-mono border ${duration === m ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/50' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
          >
            {m} MIN
          </Button>
        ))}
      </div>

      <div className="text-[5rem] lg:text-[7rem] font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-8 leading-none glow-text">
        {formatTime(timeLeft)}
      </div>

      <div className="w-full space-y-4 mb-8">
        <input 
          type="text" 
          placeholder="Session Objective..." 
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-colors font-mono"
        />
        <select 
          value={skill} 
          onChange={(e) => setSkill(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-cyan-400/50 font-mono"
        >
          {['Coding', 'Writing', 'Strategy', 'Communication', 'Learning'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 w-full mt-auto">
        {!isActive ? (
          <Button onClick={handleStart} className="flex-1 h-14 bg-cyan-400 text-black font-bold tracking-widest hover:bg-cyan-300">
            {timeLeft < duration * 60 ? 'RESUME' : 'START PROTOCOL'}
          </Button>
        ) : (
          <Button onClick={handlePause} className="flex-1 h-14 bg-amber-400/20 text-amber-400 border border-amber-400/50 font-bold tracking-widest hover:bg-amber-400/30">
            PAUSE
          </Button>
        )}
        <Button onClick={handleComplete} variant="ghost" className="h-14 px-8 border border-white/20 text-white/60 hover:text-white hover:bg-white/10 tracking-widest">
          COMPLETE
        </Button>
      </div>
    </div>
  );
}
