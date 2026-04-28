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
  const [period, setPeriod] = useState('07_WEEK');
  const accent = mode === 'titan' ? '#BC13FE' : '#00F2FF';

  const radarData = useMemo(() => {
    const workouts = tasks.filter(t => t.mode === 'titan');
    const works = tasks.filter(t => t.mode === 'zenith');
    
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
    const modeTasks = tasks.filter(t => t.mode === mode);
    
    // Group by category
    const counts: Record<string, number> = {};
    modeTasks.forEach(t => {
      const cat = t.category || 'Legacy';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks, mode]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Moved Node tabs from footer to here if needed, or just clean layout */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 mask-edges px-1 pb-1">
        {['01_TODAY', '07_WEEK', '30_MONTH', '365_YEAR', 'NEURAL_GRID'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-md text-[9px] font-mono whitespace-nowrap transition-all border shrink-0 ${period === p ? `bg-${mode === 'titan' ? 'purple-neon' : 'cyan-neon'}/20 text-${mode === 'titan' ? 'purple-neon' : 'cyan-neon'} border-${mode === 'titan' ? 'purple-neon' : 'cyan-neon'}/30` : 'bg-black/40 border-white/5 text-white/40 hover:text-white/60 hover:bg-white/10'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2 lg:gap-6 min-h-0 items-center content-start">
        {/* Radar Chart: Balance between Gym and Work */}
      <div className="flex flex-col min-h-0 w-full h-[120px] lg:h-auto pb-2">
        <h4 className="text-[8px] lg:text-[10px] font-mono text-white/40 uppercase whitespace-nowrap text-center mb-1">Balance Matrix</h4>
        <div className="flex-1 h-[100px] w-full min-h-[90px] lg:min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 6, fontWeight: 600 }} />
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
      <div className="flex flex-col min-h-0 w-full h-[120px] lg:h-auto pb-2">
        <h4 className="text-[8px] lg:text-[10px] font-mono text-white/40 uppercase whitespace-nowrap text-center mb-1">Category Vol</h4>
        <div className="flex-1 h-[100px] w-full min-h-[90px] lg:min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff40', fontSize: 6 }} 
                width={60}
              />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ 
                  backgroundColor: '#0D0D0D', 
                  border: '1px solid #ffffff10',
                  borderRadius: '8px',
                  fontSize: '8px'
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
