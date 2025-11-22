import React from 'react';
import { Disciple, Role } from '../types';

interface Props {
  disciples: Disciple[];
  limit: number; // For expulsion suggestions
}

const TeamSuggestion: React.FC<Props> = ({ disciples, limit }) => {
  // Logic to pick best 5 combatants (now more specific roles)
  const dpsCandidates = disciples.filter(d => d.role === Role.DPS).sort((a, b) => b.stats.aptitude - a.stats.aptitude);
  const tankCandidates = disciples.filter(d => d.role === Role.TANK).sort((a, b) => b.stats.bone - a.stats.bone);
  const healerCandidates = disciples.filter(d => d.role === Role.HEALER).sort((a, b) => b.stats.aptitude - a.stats.aptitude);
  const ccCandidates = disciples.filter(d => d.role === Role.CROWD_CONTROL).sort((a, b) => b.stats.intelligence - a.stats.intelligence);
  const explorerCandidates = disciples.filter(d => d.role === Role.EXPLORER_CAPTAIN).sort((a, b) => b.stats.luck - a.stats.luck);
  
  const productionCandidates = disciples
    .filter(d => d.role === Role.MASTER_CRAFTSMAN || d.role === Role.SPECIAL_CASE)
    .sort((a, b) => b.score - a.score); // Master craftsmen and special cases

  // Prioritize unique roles for the main team
  const mainTeam: Disciple[] = [];
  
  // 1. Add best Tank
  if (tankCandidates.length > 0) mainTeam.push(tankCandidates[0]);
  // 2. Add best Healer
  if (healerCandidates.length > 0 && !mainTeam.includes(healerCandidates[0])) mainTeam.push(healerCandidates[0]);
  // 3. Add best Explorer (if not already a healer/tank)
  if (explorerCandidates.length > 0 && !mainTeam.includes(explorerCandidates[0])) mainTeam.push(explorerCandidates[0]);
  // 4. Fill remaining with best DPS/CC, avoiding duplicates
  const remainingCombatants = [...dpsCandidates, ...ccCandidates].filter(d => !mainTeam.includes(d)).sort((a, b) => b.score - a.score);
  for (let i = 0; mainTeam.length < 5 && i < remainingCombatants.length; i++) {
    mainTeam.push(remainingCombatants[i]);
  }
  // Ensure the final mainTeam is capped at 5 and sorted by score for consistent display
  mainTeam.sort((a, b) => b.score - a.score);


  // --- CONTEXT-AWARE ANALYSIS ---
  // Find the best candidates for each role from the entire pool, regardless if they made main team
  const actualBestTank = disciples.reduce((best, current) => (current.stats.bone > (best?.stats.bone || 0) ? current : best), null as Disciple | null);
  const actualBestLuck = disciples.reduce((best, current) => (current.stats.luck > (best?.stats.luck || 0) ? current : best), null as Disciple | null);
  const actualBestDps = disciples.reduce((best, current) => (current.stats.aptitude > (best?.stats.aptitude || 0) ? current : best), null as Disciple | null);
  const actualBestHealer = disciples.reduce((best, current) => (current.originClass === 'Y Sư' && current.stats.aptitude > (best?.stats.aptitude || 0) ? current : best), null as Disciple | null);
  const actualBestCc = disciples.reduce((best, current) => ((current.originClass === 'Vũ Cơ' || current.originClass === 'Hoạ Sư') && current.stats.intelligence > (best?.stats.intelligence || 0) ? current : best), null as Disciple | null);


  const idealThresholds = {
    tankBone: 80,
    luck: 80, // Updated threshold
    dpsAptitude: 80, // New stat
    healerAptitude: 70, // New stat
    ccIntelligence: 80, // New stat
    potential: 70, // General potential for combat
  };

  const isTankSufficient = actualBestTank && actualBestTank.stats.bone >= idealThresholds.tankBone;
  const isLuckSufficient = actualBestLuck && actualBestLuck.stats.luck >= idealThresholds.luck;
  const isDpsSufficient = actualBestDps && actualBestDps.stats.aptitude >= idealThresholds.dpsAptitude;
  const isHealerSufficient = actualBestHealer && actualBestHealer.stats.aptitude >= idealThresholds.healerAptitude;
  const isCcSufficient = actualBestCc && actualBestCc.stats.intelligence >= idealThresholds.ccIntelligence;

  const avgPotential = mainTeam.length > 0 ? mainTeam.reduce((sum, d) => sum + d.stats.potential, 0) / mainTeam.length : 0;
  const avgAptitude = mainTeam.length > 0 ? mainTeam.reduce((sum, d) => sum + d.stats.aptitude, 0) / mainTeam.length : 0;


  const getHighestSkill = (disciple: Disciple) => {
    if (!disciple.skills || disciple.skills.length === 0) {
        return 'Tạp dịch';
    }
    const highestSkill = disciple.skills.reduce((max, current) => current.level > max.level ? current : max);
    return `${highestSkill.name} ${highestSkill.level}`;
  };

  // Expulsion suggestions
  const currentDiscipleCount = disciples.length;
  const needsExpulsion = currentDiscipleCount > limit;
  const expulsionCandidates = needsExpulsion 
    ? [...disciples].filter(d => d.verdict === 'REJECT' || (d.role === Role.FODDER && d.verdict !== 'RECRUIT'))
                   .sort((a, b) => (a.score || 0) - (b.score || 0)) // Sort by lowest score first
                   .slice(0, currentDiscipleCount - limit) // Only suggest enough to meet the limit
    : [];

  if (disciples.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-sect-gold/30 shadow-2xl mb-8">
      <h2 className="text-xl font-bold text-sect-gold mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        Đội Hình Đề Xuất (Top 5)
      </h2>

      {mainTeam.length === 0 ? (
        <p className="text-slate-400">Chưa có đủ đệ tử chiến đấu. Hãy quét thêm ảnh.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {mainTeam.map((member, idx) => (
            <div key={member.id} className="bg-slate-900 p-3 rounded border border-slate-700 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-sect-gold text-black flex items-center justify-center font-bold mb-2">
                {idx + 1}
              </div>
              <span className="font-bold text-sm truncate w-full">{member.name}</span>
              <span className="text-xs text-slate-400">TL: {member.stats.potential}</span>
              <span className="text-[10px] mt-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-600">
                {
                  member.role === Role.TANK ? 'Tanker' :
                  member.role === Role.DPS ? 'Sát Thương' :
                  member.role === Role.HEALER ? 'Hồi Máu' :
                  member.role === Role.CROWD_CONTROL ? 'Khống Chế' :
                  member.role === Role.EXPLORER_CAPTAIN ? 'Thám Hiểm' :
                  'Dự Bị'
                }
              </span>
            </div>
          ))}
          {Array.from({ length: 5 - mainTeam.length }).map((_, idx) => (
             <div key={`empty-${idx}`} className="bg-slate-900/50 border border-dashed border-slate-700 p-3 rounded flex flex-col items-center justify-center text-slate-600">
                <span className="text-sm">Còn Trống</span>
             </div>
          ))}
        </div>
      )}

      {/* Analysis Warnings */}
      <div className="space-y-2 bg-black/30 p-4 rounded">
        <h3 className="text-sm font-bold text-slate-300 uppercase">Phân tích đội hình:</h3>
        {!isTankSufficient && mainTeam.length > 0 && (
           <div className="text-red-400 text-sm flex items-center gap-2">
             <span>⚠️</span> {actualBestTank ? `Tanker yếu (Căn Cốt cao nhất là ${actualBestTank.stats.bone} của ${actualBestTank.name}). Cần tìm Tanker Căn Cốt > ${idealThresholds.tankBone}.` : 'Không có Tanker đủ tiêu chuẩn.'}
           </div>
        )}
        {!isDpsSufficient && mainTeam.length > 0 && (
           <div className="text-red-400 text-sm flex items-center gap-2">
             <span>⚠️</span> {actualBestDps ? `DPS chính yếu (Tư Chất cao nhất là ${actualBestDps.stats.aptitude} của ${actualBestDps.name}). Cần tìm DPS Tư Chất > ${idealThresholds.dpsAptitude}.` : 'Không có DPS đủ tiêu chuẩn.'}
           </div>
        )}
        {!isHealerSufficient && mainTeam.length > 0 && (
           <div className="text-yellow-400 text-sm flex items-center gap-2">
             <span>⚠️</span> {actualBestHealer ? `Healer yếu (Tư Chất cao nhất là ${actualBestHealer.stats.aptitude} của ${actualBestHealer.name}). Cần tìm Healer Tư Chất > ${idealThresholds.healerAptitude}.` : 'Không có Healer đủ tiêu chuẩn.'}
           </div>
        )}
        {!isLuckSufficient && mainTeam.length > 0 && (
           <div className="text-yellow-400 text-sm flex items-center gap-2">
             <span>⚠️</span> {actualBestLuck ? `Đội trưởng thám hiểm Cơ Duyên thấp (Cao nhất là ${actualBestLuck.stats.luck} của ${actualBestLuck.name}). Khó nhặt đồ ngon/sự kiện hiếm. Cần Cơ Duyên > ${idealThresholds.luck}.` : 'Không có ai Cơ Duyên cao đủ làm đội trưởng thám hiểm.'}
           </div>
        )}
        {(avgPotential < idealThresholds.potential || avgAptitude < idealThresholds.dpsAptitude * 0.8) && mainTeam.length > 0 && (
          <div className="text-red-400 text-sm flex items-center gap-2">
             <span>⚠️</span> Đội hình có tiềm lực/sát thương trung bình thấp (TL: {avgPotential.toFixed(1)}, TC: {avgAptitude.toFixed(1)}). Cần roll lại acc hoặc kiếm đệ tử mới có chỉ số cao hơn.
           </div>
        )}
        {isTankSufficient && isDpsSufficient && isHealerSufficient && isLuckSufficient && avgPotential >= idealThresholds.potential && mainTeam.length > 0 && (
           <div className="text-emerald-400 text-sm flex items-center gap-2">
             <span>✅</span> Đội hình khá cân bằng và tiềm năng. Có thể đầu tư tài nguyên.
           </div>
        )}
      </div>

      {productionCandidates.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700">
           <h3 className="text-sm font-bold text-blue-300 uppercase mb-2">Tổ Hậu Cần (Thợ Chuyên Nghiệp & Đặc Biệt):</h3>
           <div className="flex flex-wrap gap-2">
             {productionCandidates.map(w => (
               <div key={w.id} className="px-3 py-1 bg-blue-900/30 border border-blue-800 rounded text-xs text-blue-200">
                 {w.name} ({w.originClass}) - {getHighestSkill(w)} {w.role === Role.SPECIAL_CASE ? '(Đặc Biệt)' : ''}
               </div>
             ))}
           </div>
        </div>
      )}

      {needsExpulsion && (
        <div className="mt-6 pt-4 border-t border-red-700">
          <h3 className="text-sm font-bold text-red-300 uppercase mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12v.01"/><path d="M12 12v.01"/><path d="M14 12v.01"/><path d="M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8Z"/></svg>
            ĐỀ XUẤT TRỤC XUẤT ({expulsionCandidates.length} đệ tử cần sa thải)
          </h3>
          <p className="text-xs text-red-400 mb-2">Tông môn đã vượt quá giới hạn ({limit}). Cần trục xuất để dọn chỗ cho đệ tử tiềm năng hơn.</p>
          <div className="flex flex-wrap gap-2">
            {expulsionCandidates.map(d => (
              <div key={d.id} className="px-3 py-1 bg-red-900/30 border border-red-800 rounded text-xs text-red-200">
                {d.name} ({d.originClass}) - {d.analysis.split('.')[0]}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSuggestion;