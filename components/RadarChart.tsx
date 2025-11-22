import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { DiscipleStats } from '../types';

interface Props {
  stats: DiscipleStats;
  width?: string;
  height?: number;
}

const DiscipleRadarChart: React.FC<Props> = ({ stats, height = 250 }) => {
  const data = [
    { subject: 'Tiềm Lực', A: stats.potential, fullMark: 100 },
    { subject: 'Tư Chất', A: stats.aptitude, fullMark: 100 }, // Updated to Tư Chất
    { subject: 'Căn Cốt', A: stats.bone, fullMark: 100 },
    { subject: 'Thông Tuệ', A: stats.intelligence, fullMark: 100 },
    { subject: 'Mị Lực', A: stats.charm, fullMark: 100 },
    { subject: 'Cơ Duyên', A: stats.luck, fullMark: 100 },
  ];

  return (
    <div style={{ width: '100%', height: height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Stats"
            dataKey="A"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
      {stats.potential >= 90 && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse">
          NGHỊCH THIÊN
        </div>
      )}
    </div>
  );
};

export default DiscipleRadarChart;