import React, { useMemo } from 'react';
import { Disciple, ElementType, Role } from '../types';

interface Props {
  disciples: Disciple[];
}

const DisciplesOverview: React.FC<Props> = ({ disciples }) => {
  const stats = useMemo(() => {
    if (disciples.length === 0) {
      return {
        total: 0,
        recruitCount: 0,
        workerCount: 0,
        rejectCount: 0,
        avgPotential: 0,
        avgAptitude: 0, // Updated
        avgBone: 0,
        avgIntelligence: 0,
        avgCharm: 0,
        avgLuck: 0,
        elementCounts: {
          [ElementType.METAL]: 0,
          [ElementType.WOOD]: 0,
          [ElementType.WATER]: 0,
          [ElementType.FIRE]: 0,
          [ElementType.EARTH]: 0,
          [ElementType.MIXED]: 0,
        },
        roleCounts: { // New: Count by specific roles
          // FIX: Added missing role to satisfy the type '{ [key in Role]: number; }'.
          [Role.COMBAT_MAIN]: 0,
          [Role.DPS]: 0,
          [Role.TANK]: 0,
          [Role.HEALER]: 0,
          [Role.CROWD_CONTROL]: 0,
          [Role.EXPLORER_CAPTAIN]: 0,
          [Role.MASTER_CRAFTSMAN]: 0,
          [Role.SPECIAL_CASE]: 0,
          [Role.FODDER]: 0,
        },
        originClassCounts: new Map<string, number>(), // New: Count by origin class
        importantTraits: new Map<string, number>(),
      };
    }

    const total = disciples.length;
    let recruitCount = 0;
    let workerCount = 0;
    let rejectCount = 0;

    let sumPotential = 0;
    let sumAptitude = 0; // Updated
    let sumBone = 0;
    let sumIntelligence = 0;
    let sumCharm = 0;
    let sumLuck = 0;

    const elementCounts: { [key in ElementType]: number } = {
      [ElementType.METAL]: 0,
      [ElementType.WOOD]: 0,
      [ElementType.WATER]: 0,
      [ElementType.FIRE]: 0,
      [ElementType.EARTH]: 0,
      [ElementType.MIXED]: 0,
    };

    const roleCounts: { [key in Role]: number } = { // Initialize role counts
      // FIX: Added missing role to satisfy the type '{ [key in Role]: number; }'.
      [Role.COMBAT_MAIN]: 0,
      [Role.DPS]: 0,
      [Role.TANK]: 0,
      [Role.HEALER]: 0,
      [Role.CROWD_CONTROL]: 0,
      [Role.EXPLORER_CAPTAIN]: 0,
      [Role.MASTER_CRAFTSMAN]: 0,
      [Role.SPECIAL_CASE]: 0,
      [Role.FODDER]: 0,
    };
    
    const originClassCounts = new Map<string, number>();

    const importantTraits = new Map<string, number>();
    const keyTraits = ["Thiên Quyến Chi Nhân", "Khí Vận Chi Tử", "Tiên Thiên Linh Mạch", "Thiên Mệnh Chi Nhân", "Kiếm Tâm", "Vũ Khí Thiên Tài", "Đan Đạo Thiên Tài"];


    disciples.forEach(d => {
      if (d.verdict === 'RECRUIT') recruitCount++;
      else if (d.verdict === 'KEEP_WORKER') workerCount++;
      else rejectCount++;

      sumPotential += d.stats.potential;
      sumAptitude += d.stats.aptitude; // Updated
      sumBone += d.stats.bone;
      sumIntelligence += d.stats.intelligence;
      sumCharm += d.stats.charm;
      sumLuck += d.stats.luck;

      elementCounts[d.primaryElement]++;
      roleCounts[d.role]++; // Increment role count

      originClassCounts.set(d.originClass, (originClassCounts.get(d.originClass) || 0) + 1);

      d.traits.forEach(t => {
        if (keyTraits.includes(t.name) && t.isPositive) {
          importantTraits.set(t.name, (importantTraits.get(t.name) || 0) + 1);
        }
      });
    });

    return {
      total,
      recruitCount,
      workerCount,
      rejectCount,
      avgPotential: sumPotential / total,
      avgAptitude: sumAptitude / total, // Updated
      avgBone: sumBone / total,
      avgIntelligence: sumIntelligence / total,
      avgCharm: sumCharm / total,
      avgLuck: sumLuck / total,
      elementCounts,
      roleCounts, // Return role counts
      originClassCounts, // Return origin class counts
      importantTraits,
    };
  }, [disciples]);

  if (disciples.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl mb-8">
      <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Tổng Quan Tông Môn
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6"> {/* Adjusted grid layout */}
        {/* Verdict Counts */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          <h3 className="text-md font-semibold text-slate-300 mb-2">Phân Loại Đệ Tử</h3>
          <p className="text-emerald-400">Chiêu Mộ: <span className="font-bold">{stats.recruitCount}</span></p>
          <p className="text-blue-400">Nô Lệ: <span className="font-bold">{stats.workerCount}</span></p>
          <p className="text-red-400">Trục Xuất: <span className="font-bold">{stats.rejectCount}</span></p>
          <p className="text-slate-200 mt-2 border-t border-slate-700 pt-2">Tổng Cộng: <span className="font-bold">{stats.total}</span></p>
        </div>

        {/* Average Stats */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          <h3 className="text-md font-semibold text-slate-300 mb-2">Chỉ Số Trung Bình</h3>
          <p>Tiềm Lực: <span className="font-bold text-sect-gold">{stats.avgPotential.toFixed(1)}</span></p>
          <p>Tư Chất: <span className="font-bold">{stats.avgAptitude.toFixed(1)}</span></p> {/* Updated */}
          <p>Căn Cốt: <span className="font-bold">{stats.avgBone.toFixed(1)}</span></p>
          <p>Cơ Duyên: <span className="font-bold">{stats.avgLuck.toFixed(1)}</span></p>
        </div>

        {/* Role Counts */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          <h3 className="text-md font-semibold text-slate-300 mb-2">Phân Bố Vai Trò</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
            {Object.entries(stats.roleCounts)
              // FIX: Cast count to number to allow comparison. `Object.entries` can produce `unknown` values.
              .filter(([, count]) => (count as number) > 0) // Only show roles with disciples
              .map(([role, count]) => (
                <p key={role} className="text-slate-400">
                  {role === Role.DPS ? 'DPS' :
                   role === Role.TANK ? 'Tank' :
                   role === Role.HEALER ? 'Healer' :
                   role === Role.CROWD_CONTROL ? 'CC' :
                   role === Role.EXPLORER_CAPTAIN ? 'Thám Hiểm' :
                   role === Role.MASTER_CRAFTSMAN ? 'Thợ' :
                   role === Role.SPECIAL_CASE ? 'Đặc Biệt' :
                   role === Role.FODDER ? 'Phế Vật' : role}
                  : <span className="font-bold text-slate-200">{count}</span>
                </p>
              ))}
          </div>
        </div>

        {/* Element Counts & Important Traits */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
          <h3 className="text-md font-semibold text-slate-300 mb-2">Phân Bố Hệ & Đặc Chất</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm mb-4">
            {Object.entries(stats.elementCounts)
              // FIX: Cast count to number to allow comparison. `Object.entries` can produce `unknown` values.
              .filter(([, count]) => (count as number) > 0)
              .map(([element, count]) => (
              <p key={element} className="text-slate-400">{element}: <span className="font-bold text-slate-200">{count}</span></p>
            ))}
          </div>
          {stats.originClassCounts.size > 0 && (
            <div className="mt-2 border-t border-slate-700 pt-2">
              <h4 className="text-sm font-semibold text-slate-400 mb-1">Xuất Thân Nổi Bật:</h4>
              <div className="flex flex-wrap gap-x-2 text-xs">
                {Array.from(stats.originClassCounts.entries())
                  .sort((a,b) => b[1] - a[1]) // Sort by count descending
                  .map(([oclass, count]) => (
                  <p key={oclass} className="text-blue-300">{oclass}: <span className="font-bold">{count}</span></p>
                ))}
              </div>
            </div>
          )}
          {stats.importantTraits.size > 0 && (
            <div className="mt-4 border-t border-slate-700 pt-2">
              <h4 className="text-sm font-semibold text-slate-400 mb-1">Đặc Chất SSS/S:</h4>
              {Array.from(stats.importantTraits.entries()).map(([trait, count]) => (
                <p key={trait} className="text-xs text-yellow-300">{trait}: <span className="font-bold">{count}</span></p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisciplesOverview;
