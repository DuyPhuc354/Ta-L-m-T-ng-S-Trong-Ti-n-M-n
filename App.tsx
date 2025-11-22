
import React, { useState, ChangeEvent, useMemo, useEffect } from 'react';
import { analyzeDiscipleImage, DEFAULT_SYSTEM_INSTRUCTION } from './services/geminiService';
import { Disciple, ElementType } from './types';
import DiscipleCard from './components/DiscipleCard';
import DisciplesOverview from './components/DisciplesOverview';
import AISettings from './components/AISettings';

// --- HELPER FUNCTIONS ---

const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const readFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ------------------------

const App: React.FC = () => {
  // --- STATE ---
  const [currentFileName, setCurrentFileName] = useState<string | null>(() => {
    return localStorage.getItem('sect_lastActiveFile') || null;
  });

  const [disciples, setDisciples] = useState<Disciple[]>(() => {
    const lastFile = localStorage.getItem('sect_lastActiveFile');
    if (lastFile) {
      const saved = localStorage.getItem(`sect_file_${lastFile}`);
      try {
        const fileData = saved ? JSON.parse(saved) : {};
        return fileData.disciples || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  const [discipleLimit, setDiscipleLimit] = useState<number>(() => {
     const lastFile = localStorage.getItem('sect_lastActiveFile');
    if (lastFile) {
      const saved = localStorage.getItem(`sect_file_${lastFile}`);
      try {
        const fileData = saved ? JSON.parse(saved) : {};
        return fileData.limit || 50;
      } catch (e) {
        return 50;
      }
    }
    return 50;
  });

  // New State for AI Instructions
  const [aiInstruction, setAiInstruction] = useState<string>(() => {
    const lastFile = localStorage.getItem('sect_lastActiveFile');
    if (lastFile) {
      const saved = localStorage.getItem(`sect_file_${lastFile}`);
      try {
        const fileData = saved ? JSON.parse(saved) : {};
        return fileData.instruction || DEFAULT_SYSTEM_INSTRUCTION;
      } catch (e) {
        return DEFAULT_SYSTEM_INSTRUCTION;
      }
    }
    return DEFAULT_SYSTEM_INSTRUCTION;
  });

  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    total: number;
    current: number;
    success: number;
    duplicates: number;
    failed: number;
  } | null>(null);
  
  const [filterVerdict, setFilterVerdict] = useState<string>(() => localStorage.getItem('sect_filterVerdict') || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(() => localStorage.getItem('sect_searchQuery') || '');
  const [filterElement, setFilterElement] = useState<string>(() => localStorage.getItem('sect_filterElement') || 'ALL');
  const [sortBy, setSortBy] = useState<string>(() => localStorage.getItem('sect_sortBy') || 'SCORE_DESC');

  // Effect to save data
  useEffect(() => {
    if (currentFileName) {
      localStorage.setItem('sect_lastActiveFile', currentFileName);
      const dataToSave = {
        limit: discipleLimit,
        disciples: disciples,
        instruction: aiInstruction // Save custom instruction per file
      };
      localStorage.setItem(`sect_file_${currentFileName}`, JSON.stringify(dataToSave));
    }
  }, [currentFileName, disciples, discipleLimit, aiInstruction]);

  useEffect(() => {
    localStorage.setItem('sect_filterVerdict', filterVerdict);
    localStorage.setItem('sect_searchQuery', searchQuery);
    localStorage.setItem('sect_filterElement', filterElement);
    localStorage.setItem('sect_sortBy', sortBy);
  }, [filterVerdict, searchQuery, filterElement, sortBy]);

  // --- HANDLERS ---
  const handleCreateNewFile = () => {
    if (!newFileNameInput.trim()) {
      setError("Vui lòng nhập tên hồ sơ/file.");
      return;
    }
    const name = newFileNameInput.trim();
    const existingRawData = localStorage.getItem(`sect_file_${name}`);
    if (existingRawData) {
       if (window.confirm(`Hồ sơ "${name}" đã tồn tại. Tải lại? \n(Cancel để ghi đè)`)) {
          const existingData = JSON.parse(existingRawData);
          setDisciples(existingData.disciples || []);
          setDiscipleLimit(existingData.limit || 50);
          setAiInstruction(existingData.instruction || DEFAULT_SYSTEM_INSTRUCTION);
       } else {
          setDisciples([]);
          setDiscipleLimit(50);
          setAiInstruction(DEFAULT_SYSTEM_INSTRUCTION);
       }
    } else {
       setDisciples([]);
       setDiscipleLimit(50);
       setAiInstruction(DEFAULT_SYSTEM_INSTRUCTION);
    }
    setCurrentFileName(name);
    setError(null);
  };

  const handleImportJSON = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        const loadedDisciples = Array.isArray(parsedData) ? parsedData : parsedData.disciples;
        const loadedLimit = parsedData.limit || 50;
        const loadedInstruction = parsedData.instruction || DEFAULT_SYSTEM_INSTRUCTION;

        if (!Array.isArray(loadedDisciples)) throw new Error("Format sai.");
        
        const name = file.name.replace('.json', '');
        setDisciples(loadedDisciples);
        setDiscipleLimit(loadedLimit);
        setAiInstruction(loadedInstruction);
        setCurrentFileName(name);
        setNewFileNameInput(name);
        setError(null);
      } catch (err) {
        setError("Lỗi đọc file: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    if (!currentFileName) return;
    const dataToSave = {
        limit: discipleLimit,
        disciples: disciples,
        instruction: aiInstruction
    };
    const dataStr = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentFileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSwitchFile = () => {
    setCurrentFileName(null);
    setDisciples([]); 
    localStorage.removeItem('sect_lastActiveFile'); 
    setNewFileNameInput('');
  };

  const handleSaveInstruction = (newInstruction: string) => {
    setAiInstruction(newInstruction);
    // Clearing logic is handled by user confirmation in AISettings mostly, 
    // but if they want to "Re-evaluate", they essentially just want the new rule to be active for NEXT uploads.
    // If they want to re-evaluate existing, they must clear. 
    // We can offer to clear here if we wanted, but the component does a warning.
  };

  // --- BULK UPLOAD ---
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 100) {
      setError("Vui lòng chỉ chọn tối đa 100 ảnh.");
      return;
    }

    setLoading(true);
    setError(null);
    setProcessingStatus({
      total: files.length,
      current: 0,
      success: 0,
      duplicates: 0,
      failed: 0
    });
    
    const existingHashes = new Set(disciples.map(d => d.imageHash).filter(Boolean));
    const filesArray = Array.from(files) as File[];
    const uniqueFilesToProcess: { file: File; hash: string }[] = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      try {
        const hash = await calculateFileHash(file);
        if (existingHashes.has(hash) || uniqueFilesToProcess.some(f => f.hash === hash)) {
           setProcessingStatus(prev => prev ? { ...prev, duplicates: prev.duplicates + 1, current: prev.current + 1 } : null);
        } else {
           uniqueFilesToProcess.push({ file, hash });
        }
      } catch (e) {
        setProcessingStatus(prev => prev ? { ...prev, failed: prev.failed + 1, current: prev.current + 1 } : null);
      }
    }

    const BASE_DELAY_MS = 2000; 
    const MAX_ATTEMPTS = 4;

    for (let i = 0; i < uniqueFilesToProcess.length; i++) {
      const { file, hash } = uniqueFilesToProcess[i];
      let attempts = 0;
      let success = false;

      while (attempts < MAX_ATTEMPTS && !success) {
        try {
          attempts++;
          const base64 = await readFileToBase64(file);
          // Pass the custom AI instruction here
          const newDisciple = await analyzeDiscipleImage(base64, aiInstruction);
          newDisciple.imageHash = hash;
          
          setDisciples(prev => [newDisciple, ...prev]);
          setProcessingStatus(prev => prev ? { ...prev, success: prev.success + 1, current: prev.current + 1 } : null);
          success = true;
        } catch (err: any) {
          const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota');
          if (isRateLimit && attempts < MAX_ATTEMPTS) {
            const waitTime = 10000 * Math.pow(2, attempts - 1);
            await delay(waitTime);
          } else {
             setProcessingStatus(prev => prev ? { ...prev, failed: prev.failed + 1, current: prev.current + 1 } : null);
             break; 
          }
        }
      }
      if (i < uniqueFilesToProcess.length - 1) await delay(BASE_DELAY_MS);
    }
    setLoading(false);
    event.target.value = '';
  };

  const filteredDisciples = useMemo(() => {
    let result = [...disciples];

    if (filterVerdict !== 'ALL') {
      result = result.filter(d => d.verdict === filterVerdict);
    }

    if (filterElement === 'SINGLE') result = result.filter(d => d.primaryElement !== ElementType.MIXED);
    else if (filterElement === 'MIXED') result = result.filter(d => d.primaryElement === ElementType.MIXED);
    else if (filterElement !== 'ALL') result = result.filter(d => d.primaryElement === filterElement);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(q) ||
        d.originClass.toLowerCase().includes(q) ||
        d.analysis.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'SCORE_DESC': return (b.score || 0) - (a.score || 0);
        case 'POTENTIAL_DESC': return b.stats.potential - a.stats.potential;
        case 'NAME_ASC': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return result;
  }, [disciples, filterVerdict, searchQuery, filterElement, sortBy]);

  if (!currentFileName) {
    return (
      <div className="min-h-screen bg-sect-dark flex items-center justify-center p-4 font-sans text-slate-200">
        <div className="max-w-md w-full bg-sect-panel p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sect-green to-sect-gold mb-6 text-center">
            Hộ Pháp Tông Môn
          </h1>
          <div className="space-y-4">
            <input 
              type="text" 
              value={newFileNameInput}
              onChange={(e) => setNewFileNameInput(e.target.value)}
              placeholder="Tên Hồ Sơ (VD: Server 1)"
              className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFile()}
            />
            <button onClick={handleCreateNewFile} className="w-full bg-sect-gold text-black font-bold py-2 rounded hover:bg-yellow-600">Tạo Mới / Mở</button>
            <div className="text-center text-xs text-slate-500 uppercase py-2">Hoặc</div>
            <label className="block w-full bg-slate-800 border border-dashed border-slate-600 rounded py-2 text-center cursor-pointer hover:bg-slate-700">
              <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
              <span className="text-slate-400 text-sm">Nhập từ file JSON</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sect-dark text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
           <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sect-green to-sect-gold">
                Hộ Pháp Tông Môn
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm">
                 <span className="text-sect-gold font-bold">{currentFileName}</span>
                 <span className="text-slate-600">|</span>
                 <div className="flex items-center gap-2">
                    <label>Giới hạn:</label>
                    <input
                        type="number"
                        value={discipleLimit}
                        onChange={(e) => setDiscipleLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="bg-slate-900 border border-slate-700 rounded px-2 w-16 text-center"
                    />
                 </div>
              </div>
           </div>
           <div className="flex gap-2">
             <button onClick={handleExportJSON} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300" title="Lưu JSON">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
             </button>
             <button onClick={handleSwitchFile} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-red-400" title="Thoát">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
             </button>
           </div>
        </header>

        {/* AI SETTINGS (NEW) */}
        <AISettings currentInstruction={aiInstruction} onSave={handleSaveInstruction} />

        {/* UPLOAD SECTION */}
        <div className="mb-8">
           {loading && processingStatus ? (
             <div className="bg-sect-panel p-6 rounded-xl border border-slate-700 text-center">
                <h3 className="text-lg font-bold mb-2">Đang phân tích... {processingStatus.current}/{processingStatus.total}</h3>
                <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4">
                   <div className="bg-sect-green h-2.5 rounded-full transition-all" style={{ width: `${(processingStatus.current / processingStatus.total) * 100}%` }}></div>
                </div>
                <div className="flex justify-center gap-4 text-sm">
                   <span className="text-emerald-400">Thành công: {processingStatus.success}</span>
                   <span className="text-red-400">Lỗi: {processingStatus.failed}</span>
                </div>
             </div>
           ) : (
             <label className="block w-full border-2 border-dashed border-slate-700 hover:border-sect-green bg-slate-900/50 rounded-xl p-6 text-center cursor-pointer transition-all group">
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                <div className="text-slate-400 group-hover:text-sect-green">
                   <svg className="mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                   <span className="font-bold text-lg">Tải ảnh đệ tử (Batch Scan)</span>
                   <p className="text-xs mt-1 opacity-70">Hỗ trợ 100 ảnh/lần. Tự động loại trùng.</p>
                </div>
             </label>
           )}
           {error && <div className="mt-4 p-3 bg-red-900/50 text-red-200 text-sm rounded border border-red-500 text-center">{error}</div>}
        </div>

        {/* OVERVIEW & LIST */}
        {disciples.length > 0 && (
          <>
            <DisciplesOverview disciples={disciples} />
            
            {/* FILTERS */}
            <div className="bg-sect-panel p-4 rounded-lg border border-slate-700 mb-6 flex flex-wrap items-center gap-3 sticky top-2 z-20 shadow-lg">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, lý do..."
                className="bg-slate-900 border border-slate-600 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-sect-green outline-none flex-grow md:flex-grow-0 md:w-48"
              />
              <select 
                value={filterVerdict} onChange={(e) => setFilterVerdict(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-sm rounded px-3 py-1.5 outline-none"
              >
                <option value="ALL">Tất cả Loại</option>
                <option value="RECRUIT">Chiêu Mộ</option>
                <option value="KEEP_WORKER">Nô Lệ</option>
                <option value="EXPEL_CANDIDATE">Có Thể Đuổi</option>
                <option value="REJECT">Trục Xuất</option>
              </select>
              <select 
                value={filterElement} onChange={(e) => setFilterElement(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-sm rounded px-3 py-1.5 outline-none"
              >
                <option value="ALL">Tất cả Hệ</option>
                <option value="SINGLE">Đơn Hệ</option>
                <option value="MIXED">Tạp</option>
                <option value="Kim">Kim</option>
                <option value="Mộc">Mộc</option>
                <option value="Thủy">Thủy</option>
                <option value="Hỏa">Hỏa</option>
                <option value="Thổ">Thổ</option>
              </select>
              <div className="ml-auto text-sm text-slate-400">
                {filteredDisciples.length} / {disciples.length}
              </div>
            </div>

            {/* LIST VIEW (SIMPLIFIED) */}
            <div className="flex flex-col gap-3">
               {filteredDisciples.map(d => (
                 <DiscipleCard key={d.id} disciple={d} onDelete={(id) => {
                    if(window.confirm('Xóa đệ tử này?')) setDisciples(prev => prev.filter(x => x.id !== id));
                 }} />
               ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
