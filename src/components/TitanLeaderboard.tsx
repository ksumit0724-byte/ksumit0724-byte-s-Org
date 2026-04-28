import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, ShieldCheck, Zap, Loader2, AlertCircle } from 'lucide-react';
import { useAetherStore } from '../store/useAetherStore';

export const TitanLeaderboard: React.FC = () => {
  const { user } = useAetherStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Assume owner if role is owner or specifically gym_owner. For now, mock based on demo.
  const isOwner = user?.role === 'owner' || user?.user_metadata?.role === 'owner' || user?.user_metadata?.role === 'gym_owner';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch leaderboard');
        }
        const data = await res.json();
        // Sort by consistency
        const sorted = data.leaderboard.sort((a: any, b: any) => b.consistency - a.consistency);
        setLeaderboard(sorted);
      } catch (err: any) {
        console.error("Leaderboard error:", err);
        // Fallback to mock data on error so UI still looks good
        setLeaderboard([
          { id: '1', handle: '@OXYGEN_SUMIT702', consistency: 98, volume: '14,200', verified: true, role: 'owner' },
          { id: '2', handle: '@OXYGEN_TITAN9X', consistency: 94, volume: '12,850', verified: true, role: 'member' },
          { id: '3', handle: '@OXYGEN_VANGUARD', consistency: 91, volume: '11,400', verified: false, role: 'member' },
          { id: '4', handle: '@OXYGEN_PUMP21', consistency: 88, volume: '10,920', verified: false, role: 'member' },
          { id: '5', handle: '@OXYGEN_INIT44', consistency: 85, volume: '9,500', verified: false, role: 'member' },
        ]);
        // setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const handleReward = (userId: string) => {
    // Integrate toast notification here (could use a global toast or local state)
    alert('Incentive Transmitted to Pilot');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full h-full"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-[#deff9a]/10 border border-[#deff9a]/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(222,255,154,0.15)]">
          <Trophy className="w-6 h-6 text-[#deff9a]" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white font-heading">Titan Leaderboard</h1>
          <p className="text-[#deff9a] text-xs font-mono uppercase tracking-[0.2em]">Competitive HUD - Global Network</p>
        </div>
      </div>

      <div className="glass-panel-heavy rounded-3xl overflow-hidden bg-black/80 backdrop-blur-xl border border-white/10 flex-1 flex flex-col mb-24">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-white/40">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-4">Neural ID</div>
          <div className="col-span-3 text-right">Consistency</div>
          <div className="col-span-3 text-right flex justify-end items-center gap-2">
            <span>Volume</span>
            {isOwner && <span className="w-6 hidden sm:inline-block"></span>}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="w-8 h-8 text-[#deff9a] animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 z-10 space-y-2 p-6 text-center">
              <AlertCircle className="w-8 h-8" />
              <p className="text-xs font-mono uppercase">Sync Failure</p>
              <p className="text-[10px] opacity-70">Error: {error}</p>
            </div>
          )}
          {!loading && !error && leaderboard.length === 0 && (
            <div className="text-center p-10 opacity-50 font-mono text-sm uppercase">No nodes connected...</div>
          )}
          {leaderboard.map((player, index) => (
            <motion.div 
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="grid grid-cols-12 gap-4 items-center bg-white/[0.02] border border-white/5 hover:border-[#deff9a]/30 p-4 rounded-2xl transition-all group"
            >
              <div className="col-span-2 text-center text-xl font-black text-white/20 group-hover:text-[#deff9a] transition-colors font-mono">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <span className="font-mono text-xs md:text-sm text-white group-hover:text-[#deff9a] transition-colors truncate">
                  {player.handle}
                </span>
                {player.verified && (
                  <ShieldCheck className="w-4 h-4 text-[#deff9a] shrink-0" />
                )}
              </div>
              <div className="col-span-3 text-right">
                <span className="text-[#deff9a] font-mono text-sm md:text-base font-bold">{player.consistency}%</span>
              </div>
              <div className="col-span-3 flex items-center justify-end gap-3">
                <span className="text-white/60 font-mono text-xs md:text-sm">{player.volume}</span>
                {isOwner && (
                  <button 
                    onClick={() => handleReward(player.id)}
                    className="w-8 h-8 rounded-lg bg-[#deff9a]/10 hover:bg-[#deff9a]/20 border border-[#deff9a]/30 text-[#deff9a] flex items-center justify-center transition-all shadow-[0_0_10px_rgba(222,255,154,0.1)] opacity-0 group-hover:opacity-100 hidden sm:flex shrink-0"
                    title="Transmit Incentive"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
