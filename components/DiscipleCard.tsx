import React from 'react';
import { Disciple, Role } from '../types';
import DiscipleRadarChart from './RadarChart';

interface Props {
  disciple: Disciple;
  onDelete: (id: string) => void;
}

const DiscipleCard: React.FC<Props> = ({ disciple, onDelete }) => {
  const isRecruit = disciple.verdict === 'RECRUIT';
  const isReject = disciple.verdict === 'REJECT';
  const isWorker = disciple.verdict === 'KEEP_WORKER';

  const borderColor = isRecruit 
    ? 'border-emerald-500' 
    : isWorker 
      ? 'border-blue-500' 
      : 'border-red-500';

  const headerColor = isRecruit 
    ? 'bg-emerald-900/50 text-emerald-200' 
    : isWorker 
      ? 'bg-blue-900/50 text-blue-200' 
      : 'bg-red-900/50 text-red-200';

  const getRoleDisplayName = (role: Role) => {
    switch(role) {
      case Role.DPS: return 'DPS (Sát Thương)';
      case Role.TANK: return 'TANK (Chịu Đòn)';
      case Role.HEALER: return 'HEALER (Hồi Máu)';
      case Role.CROWD_CONTROL: return 'CC (Khống Chế)';
      case Role.EXPLORER_CAPTAIN: return 'Thám Hiểm';
      case Role.MASTER_CRAFTSMAN: return 'Thợ Chuyên Nghiệp';
      case Role.FODDER: return 'Phế Vật';
      case Role.SPECIAL_CASE: return 'Đặc Biệt';
      default: return role.replace('_', ' ');
    }
  }

  return (
    <div className={`relative bg-sect-panel border-2 ${borderColor} rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl`}>
      <button 
        onClick={() => onDelete(disciple.id)}
        className="absolute top-2 right-2 z-10 text-slate-400 hover:text-red-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <div className={`px-4 py-2 flex justify-between items-center ${headerColor}`}>
        <div>
          <h3 className="font-bold text-lg">{disciple.name}</h3>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-80">
            {disciple.originClass} - {getRoleDisplayName(disciple.role)}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-black">{disciple.stats.potential}</span>
          <span className="text-[10px] uppercase">Tiềm Lực</span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col justify-center">
          <DiscipleRadarChart stats={disciple.stats} height={200} />
        </div>

        <div className="space-y-3 text-sm">
          {/* Verdict Badge */}
          <div className="mb-2">
             {isRecruit && <span className="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold">NÊN CHIÊU MỘ</span>}
             {isWorker && <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">NÔ LỆ/THỢ</span>}
             {isReject && <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">TRỤC XUẤT/HIẾN TẾ</span>}
          </div>

          {/* Traits */}
          <div>
            <p className="text-slate-400 text-xs font-bold mb-1 uppercase">Đặc Chất (Traits)</p>
            <div className="flex flex-wrap gap-1">
              {disciple.traits.map((t, idx) => (
                <span 
                  key={idx} 
                  className={`px-2 py-0.5 rounded text-xs border ${
                    t.tier === 'S' ? 'bg-yellow-600/30 border-yellow-500 text-yellow-200' :
                    t.isPositive ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200' : 
                    'bg-red-600/30 border-red-500 text-red-200'
                  }`}
                  title={t.description}
                >
                  {t.name}
                </span>
              ))}
              {disciple.traits.length === 0 && <span className="text-slate-500 italic">Không có</span>}
            </div>
          </div>

           {/* Skills */}
           <div>
            <p className="text-slate-400 text-xs font-bold mb-1 uppercase">Kỹ Năng (Nghề)</p>
            <div className="flex flex-wrap gap-1">
              {disciple.skills.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded text-xs bg-slate-700 border border-slate-600 text-slate-200">
                  {s.name}: {s.level}
                </span>
              ))}
              {disciple.skills.length === 0 && <span className="text-slate-500 italic">Không nổi bật</span>}
            </div>
          </div>

           {/* Element */}
           <div>
            <p className="text-slate-400 text-xs font-bold mb-1 uppercase">Hệ Chính</p>
            <span className="text-slate-200">{disciple.primaryElement}</span>
          </div>

          {/* Reasoning */}
          <div className="mt-2 pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-300 italic">"{disciple.analysis}"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscipleCard;