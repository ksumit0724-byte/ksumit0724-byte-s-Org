import { motion } from "motion/react";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card } from "./ui/card";
import { AppMode } from "../store/useAetherStore";
import { Progress } from "./ui/progress";

export function InhibitorWidget({ mode }: { mode: AppMode }) {
  const isTitan = mode === 'titan';
  const label = isTitan ? "Macro Distribution" : "Distraction Lock";
  const accent = isTitan ? "purple-neon" : "cyan-neon";

  return (
    <div className="flex flex-col justify-between p-4 bg-black/30 rounded-2xl border border-white/5">
      <div>
        <h4 className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-4 font-mono">{label}</h4>
        
        {isTitan ? (
          <div className="flex gap-4">
            {['PRO', 'CARB', 'FAT'].map((m, i) => (
              <div key={m} className="flex flex-col items-center">
                <div className="w-10 h-24 bg-white/5 rounded-full relative flex flex-col justify-end overflow-hidden">
                  <div 
                    className={`w-full ${i === 0 ? 'bg-gradient-to-t from-cyan-neon to-cyan-neon/40' : i === 1 ? 'bg-gradient-to-t from-purple-neon to-purple-neon/40' : 'bg-white/20'}`} 
                    style={{ height: i === 0 ? '70%' : i === 1 ? '45%' : '20%' }}
                  />
                </div>
                <span className="text-[9px] mt-2 font-mono">{m}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40">Interception</span>
                <span className="font-mono text-cyan-neon">94%</span>
              </div>
              <Progress value={94} className="h-1 bg-white/5" />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-white/10 mt-4">
        <p className={`text-[10px] ${isTitan ? 'text-cyan-neon' : 'text-purple-neon'} font-bold uppercase tracking-widest`}>
            {isTitan ? 'Macro Node Active' : 'System Guard Online'}
        </p>
        <p className="text-[10px] text-white/60">Signals nominal. Defensive filters engaged.</p>
      </div>
    </div>
  );
}
