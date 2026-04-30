import { useState, useEffect } from "react";
import { getSupabase } from "../../lib/supabase";
import { useAetherStore } from "../../store/useAetherStore";

export function SkillProgress() {
  const { user } = useAetherStore();
  const [skills, setSkills] = useState<{ category: string, xp: number, level: number }[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchSkills = async () => {
      const client = getSupabase();
      if (!client) return;
      
      const { data } = await client.from('user_xp').select('category, xp_points').eq('user_id', user.id).eq('mode', 'zenith');
      
      const skillMap: Record<string, number> = {
        'Coding': 0,
        'Writing': 0,
        'Strategy': 0,
        'Communication': 0,
        'Learning': 0
      };

      if (data) {
        data.forEach(d => {
          if (skillMap[d.category] !== undefined) {
            skillMap[d.category] += d.xp_points || 0;
          } else {
            skillMap[d.category] = d.xp_points || 0;
          }
        });
      }

      const formatted = Object.keys(skillMap).map(k => {
        const xp = skillMap[k];
        const level = Math.floor(xp / 500) + 1;
        return { category: k, xp, level };
      });

      setSkills(formatted);
    };

    fetchSkills();
  }, [user]);

  return (
    <div className="glass-panel p-5 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-xs uppercase tracking-widest text-white/50 mb-6 font-bold">Cognitive Skill Matrix</h3>
      <div className="space-y-6">
        {skills.map(s => {
          const progress = (s.xp % 500) / 500 * 100;
          return (
            <div key={s.category} className="space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                <span className="text-white">{s.category}</span>
                <span className="text-cyan-400">LVL {s.level}</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-400 opacity-80 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[8px] text-white/30 text-right font-mono">{s.xp % 500} / 500 XP</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
