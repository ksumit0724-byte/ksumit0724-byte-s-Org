import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  Cell
} from 'recharts';
import { AppMode } from '../store/useAetherStore';

const periods = ['1D', '1W', '1M', '1Y'];

const dummyBarData = [
  { day: 'MON', value: 12 },
  { day: 'TUE', value: 18 },
  { day: 'WED', value: 15 },
  { day: 'THU', value: 25 },
  { day: 'FRI', value: 20 },
  { day: 'SAT', value: 30 },
  { day: 'SUN', value: 28 },
];

const dummyRadarData = [
  { subject: 'Physical', A: 120, B: 110, fullMark: 150 },
  { subject: 'Cognitive', A: 98, B: 130, fullMark: 150 },
  { subject: 'Stamina', A: 86, B: 130, fullMark: 150 },
  { subject: 'Discipline', A: 99, B: 100, fullMark: 150 },
  { subject: 'Recovery', A: 85, B: 90, fullMark: 150 },
  { subject: 'Nutrition', A: 65, B: 85, fullMark: 150 },
];

import { useAetherStore } from '../store/useAetherStore';

export default function NeuralAnalytics({ mode }: { mode: AppMode }) {
  const { tasks } = useAetherStore();
  const [period, setPeriod] = useState('1W');
  const accent = mode === 'titan' ? '#BC13FE' : '#00F2FF';

  const radarData = useMemo(() => {
    const workouts = tasks.filter(t => t.type === 'workout');
    const works = tasks.filter(t => t.type === 'work');
    
    const physicalIntensity = workouts.length > 0 
      ? Math.round(workouts.reduce((acc, curr) => acc + (curr.intensity || 0), 0) / workouts.length)
      : 0;
      
    const cognitiveIntensity = works.length > 0
      ? Math.round(works.reduce((acc, curr) => acc + (curr.intensity || 0), 0) / works.length)
      : 0;

    return [
      { subject: 'Physical', A: physicalIntensity, fullMark: 100 },
      { subject: 'Cognitive', A: cognitiveIntensity, fullMark: 100 },
      { subject: 'Stamina', A: physicalIntensity * 0.8, fullMark: 100 },
      { subject: 'Discipline', A: Math.min(100, (workouts.length + works.length) * 5), fullMark: 100 },
      { subject: 'Recovery', A: 70, fullMark: 100 },
      { subject: 'Nutrition', A: 65, fullMark: 100 },
    ];
  }, [tasks]);

  const categoryData = useMemo(() => {
    const modeTasks = tasks.filter(t => t.type === (mode === 'titan' ? 'workout' : 'work'));
    
    // Group by category
    const counts: Record<string, number> = {};
    modeTasks.forEach(t => {
      const cat = t.category || 'Legacy';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks, mode]);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Sliding Timeline */}
      <div className="flex justify-center">
        <div className="flex bg-white/5 rounded-full p-1 border border-white/5 relative">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-1 text-[10px] font-mono z-10 transition-colors ${period === p ? 'text-black' : 'text-white/40'}`}
            >
              {p}
            </button>
          ))}
          <motion.div
            layoutId="period-bg"
            className={`absolute top-1 bottom-1 ${mode === 'titan' ? 'bg-purple-neon' : 'bg-cyan-neon'} rounded-full`}
            style={{ 
              left: `${periods.indexOf(period) * 25 + 1}%`,
              width: '23%'
            }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 gap-8 min-h-[300px]">
      {/* Radar Chart: Balance between Gym and Work */}
      <div className="flex flex-col gap-4 min-h-0">
        <h4 className="text-[10px] font-mono text-white/40 uppercase">Neural Balance Matrix</h4>
        <div className="flex-1 min-h-[220px] md:min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Optimization"
                dataKey="A"
                stroke={accent}
                fill={accent}
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Category Volume */}
      <div className="flex flex-col gap-4 min-h-0">
        <h4 className="text-[10px] font-mono text-white/40 uppercase">Category Allocation Volume</h4>
        <div className="flex-1 min-h-[220px] md:min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff40', fontSize: 8 }} 
                width={80}
              />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ 
                  backgroundColor: '#0D0D0D', 
                  border: '1px solid #ffffff10',
                  borderRadius: '8px',
                  fontSize: '10px'
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={accent} fillOpacity={0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    </div>
  );
}
