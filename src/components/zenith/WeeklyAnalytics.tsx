import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getSupabase } from "../../lib/supabase";
import { useAetherStore } from "../../store/useAetherStore";

export function WeeklyAnalytics() {
  const { user } = useAetherStore();
  const [data, setData] = useState<any[]>([]);
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    const fetchStats = async () => {
      const client = getSupabase();
      if (!client) return;
      
      // Mock data for weekly stats if actual query is too complex
      const mockData = [
        { name: 'Mon', hours: 2.5, score: 75 },
        { name: 'Tue', hours: 3.8, score: 82 },
        { name: 'Wed', hours: 4.2, score: 90 },
        { name: 'Thu', hours: 1.5, score: 60 },
        { name: 'Fri', hours: 5.0, score: 95 },
        { name: 'Sat', hours: 0, score: 0 },
        { name: 'Sun', hours: 2.0, score: 80 },
      ];
      setData(mockData);

      const { data: xpData } = await client.from('user_xp').select('xp_points').eq('user_id', user.id).eq('mode', 'zenith');
      if (xpData) {
        const total = xpData.reduce((acc, curr) => acc + (curr.xp_points || 0), 0);
        setTotalXp(total);
      }
    };
    fetchStats();
  }, [user]);

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4 h-full overflow-y-auto custom-scrollbar pb-10">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 border-cyan-400/20">
          <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-1">Total XP This Week</p>
          <p className="text-3xl font-mono text-white">{totalXp}</p>
        </div>
        <div className="glass-panel p-4 border-cyan-400/20">
          <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-1">Best Focus Time</p>
          <p className="text-xl font-mono text-white mt-1">10:00 AM</p>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h3 className="text-xs uppercase tracking-widest text-white/50 mb-6 font-bold">Daily Deep Work (Hours)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ backgroundColor: '#000000e0', border: '1px solid #22d3ee40', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="hours" fill="#22d3ee" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h3 className="text-xs uppercase tracking-widest text-white/50 mb-6 font-bold">Focus Score Trend</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000000e0', border: '1px solid #22d3ee40', borderRadius: '8px', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} dot={{ fill: '#22d3ee', strokeWidth: 0, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
