
import React from 'react';
import { Disciple } from '../types';

interface Props {
  disciple: Disciple;
  onDelete: (id: string) => void;
}

const DiscipleCard: React.FC<Props> = ({ disciple, onDelete }) => {
  const { verdict, name, primaryElement, analysis, originClass } = disciple;

  let badgeColor = '';
  let badgeText = '';
  let borderColor = '';
  let bgGradient = '';

  switch (verdict) {
    case 'RECRUIT':
      badgeColor = 'bg-emerald-500 text-white';
      badgeText = 'CHIÊU MỘ';
      borderColor = 'border-emerald-500/50';
      bgGradient = 'from-emerald-900/20 to-transparent';
      break;
    case 'KEEP_WORKER':
      badgeColor = 'bg-blue-500 text-white';
      badgeText = 'NÔ LỆ';
      borderColor = 'border-blue-500/50';
      bgGradient = 'from-blue-900/20 to-transparent';
      break;
    case 'EXPEL_CANDIDATE':
      badgeColor = 'bg-yellow-500 text-black';
      badgeText = 'CÓ THỂ TRỤC XUẤT';
      borderColor = 'border-yellow-500/50';
      bgGradient = 'from-yellow-900/20 to-transparent';
      break;
    case 'REJECT':
      badgeColor = 'bg-red-600 text-white';
      badgeText = 'TRỤC XUẤT';
      borderColor = 'border-red-600/50';
      bgGradient = 'from-red-900/20 to-transparent';
      break;
  }

  const elementColors: Record<string, string> = {
    'Kim': 'text-yellow-200',
    'Mộc': 'text-green-400',
    'Thủy': 'text-blue-400',
    'Hỏa': 'text-red-400',
    'Thổ': 'text-orange-300',
    'Tạp': 'text-gray-400',
  };

  return (
    <div className={`relative group bg-sect-panel rounded-lg border ${borderColor} p-3 flex items-center gap-4 shadow-md hover:bg-slate-800 transition-all overflow-hidden`}>
      {/* Subtle Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${bgGradient} pointer-events-none`} />

      {/* Delete Button (Hover only) */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(disciple.id); }}
        className="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Xóa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      {/* Main Content */}
      <div className="flex-grow flex flex-col md:flex-row md:items-center gap-2 md:gap-4 z-0">
        
        {/* Left: Name & Element */}
        <div className="min-w-[140px]">
          <div className="flex items-baseline gap-2">
            <h3 className="font-bold text-slate-200 text-lg leading-tight">{name}</h3>
            <span className={`text-xs font-bold uppercase ${elementColors[primaryElement] || 'text-gray-400'}`}>
              {primaryElement}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">{originClass}</p>
        </div>

        {/* Middle: Verdict Badge */}
        <div className="shrink-0">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider shadow-sm ${badgeColor}`}>
            {badgeText}
          </span>
        </div>

        {/* Right: Reason */}
        <div className="flex-grow border-l border-slate-700 pl-0 md:pl-4 mt-1 md:mt-0">
          <p className="text-sm text-slate-300 italic line-clamp-2 md:line-clamp-1">
            "{analysis}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiscipleCard;
