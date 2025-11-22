import React, { useState, ChangeEvent, useMemo, useEffect, useRef } from 'react';
import { analyzeDiscipleImage } from './services/geminiService';
import { Disciple, ElementType, Role } from './types';
import DiscipleCard from './components/DiscipleCard';
import TeamSuggestion from './components/TeamSuggestion';
import DisciplesOverview from './components/DisciplesOverview'; // Import new component

// --- HELPER FUNCTIONS ---

// Calculate SHA-256 hash of a file to detect duplicates
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
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ------------------------

const App: React.FC = () => {
  // --- FILE MANAGEMENT STATE ---
  const [currentFileName, setCurrentFileName] = useState<string | null>(() => {
    return localStorage.getItem('sect_lastActiveFile') || null;
  });

  const [disciples, setDisciples] = useState<Disciple[]>(() => {
    const lastFile = localStorage.getItem('sect_lastActiveFile');
    if (lastFile) {
      const saved = localStorage.getItem(`sect_file_${lastFile}`);
      try {
        const fileData = saved ? JSON.parse(saved) : {};
        return fileData.disciples || []; // Support new and old format
      } catch (e) {
        console.error("Error parsing saved file:", e);
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


  const [newFileNameInput, setNewFileNameInput] = useState('');
  // -----------------------------

  // --- PROCESSING STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    total: number;
    current: number;
    success: number;
    duplicates: number;
    failed: number;
  } | null>(null);
  
  // Filter and Sort State (Global preferences, kept across files)
  const [filterVerdict, setFilterVerdict] = useState<string>(() => {
    return localStorage.getItem('sect_filterVerdict') || 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => { // Renamed from filterName
    return localStorage.getItem('sect_searchQuery') || ''; // Updated key
  });
  const [filterElement, setFilterElement] = useState<string>(() => {
    return localStorage.getItem('sect_filterElement') || 'ALL';
  });
  const [sortBy, setSortBy] = useState<string>(() => {
    return localStorage.getItem('sect_sortBy') || 'SCORE_DESC';
  });

  // Effect to save data whenever disciples, limit or filename changes
  useEffect(() => {
    if (currentFileName) {
      localStorage.setItem('sect_lastActiveFile', currentFileName);
      const dataToSave = {
        limit: discipleLimit,
        disciples: disciples
      };
      localStorage.setItem(`sect_file_${currentFileName}`, JSON.stringify(dataToSave));
    }
  }, [currentFileName, disciples, discipleLimit]);

  // Effect to save filters
  useEffect(() => {
    localStorage.setItem('sect_filterVerdict', filterVerdict);
    localStorage.setItem('sect_searchQuery', searchQuery); // Updated key
    localStorage.setItem('sect_filterElement', filterElement);
    localStorage.setItem('sect_sortBy', sortBy);
  }, [filterVerdict, searchQuery, filterElement, sortBy]); // Updated dependency

  // --- FILE HANDLERS ---
  const handleCreateNewFile = () => {
    if (!newFileNameInput.trim()) {
      setError("Vui lòng nhập tên hồ sơ/file.");
      return;
    }
    const name = newFileNameInput.trim();
    const existingRawData = localStorage.getItem(`sect_file_${name}`);
    if (existingRawData) {
       const confirmLoad = window.confirm(`Hồ sơ "${name}" đã tồn tại. Bạn có muốn tải lại dữ liệu cũ không? \n(Nhấn Cancel để ghi đè/tạo mới hoàn toàn)`);
       if (confirmLoad) {
          const existingData = JSON.parse(existingRawData);
          setDisciples(existingData.disciples || []);
          setDiscipleLimit(existingData.limit || 50);
       } else {
          setDisciples([]);
          setDiscipleLimit(50);
       }
    } else {
       setDisciples([]);
       setDiscipleLimit(50);
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
        
        // Check if it's the new format {limit, disciples} or old array format
        const loadedDisciples = Array.isArray(parsedData) ? parsedData : parsedData.disciples;
        const loadedLimit = parsedData.limit || 50;

        if (!Array.isArray(loadedDisciples)) {
          throw new Error("File không đúng định dạng danh sách đệ tử.");
        }
        
        const name = file.name.replace('.json', '');
        setDisciples(loadedDisciples);
        setDiscipleLimit(loadedLimit);
        setCurrentFileName(name);
        setNewFileNameInput(name);
        setError(null);
      } catch (err) {
        setError("Lỗi đọc file JSON: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    if (!currentFileName) return;
    const dataToSave = {
        limit: discipleLimit,
        disciples: disciples
    };
    const dataStr = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentFileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSwitchFile = () => {
    setCurrentFileName(null);
    setDisciples([]); 
    setDiscipleLimit(50);
    localStorage.removeItem('sect_lastActiveFile'); 
    setNewFileNameInput('');
  };
  // ---------------------

  // --- BULK UPLOAD LOGIC ---
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 100) {
      setError("Vui lòng chỉ chọn tối đa 100 ảnh mỗi lần.");
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

    // Step 1: Pre-calculate hashes and filter duplicates
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      try {
        const hash = await calculateFileHash(file);
        if (existingHashes.has(hash)) {
          setProcessingStatus(prev => prev ? { ...prev, duplicates: prev.duplicates + 1, current: prev.current + 1 } : null);
        } else {
          if (uniqueFilesToProcess.some(f => f.hash === hash)) {
             setProcessingStatus(prev => prev ? { ...prev, duplicates: prev.duplicates + 1, current: prev.current + 1 } : null);
          } else {
             uniqueFilesToProcess.push({ file, hash });
          }
        }
      } catch (e) {
        console.error("Hashing failed", e);
        setProcessingStatus(prev => prev ? { ...prev, failed: prev.failed + 1, current: prev.current + 1 } : null);
      }
    }

    // Step 2: Process unique files sequentially with a base delay and aggressive retry
    const BASE_DELAY_MS = 2000; // 2 seconds between requests (30 RPM)
    const MAX_ATTEMPTS = 4;

    for (let i = 0; i < uniqueFilesToProcess.length; i++) {
      const { file, hash } = uniqueFilesToProcess[i];
      let attempts = 0;
      let success = false;

      while (attempts < MAX_ATTEMPTS && !success) {
        try {
          attempts++;
          const base64 = await readFileToBase64(file);
          const newDisciple = await analyzeDiscipleImage(base64);
          newDisciple.imageHash = hash;
          
          setDisciples(prev => [newDisciple, ...prev]);
          setProcessingStatus(prev => prev ? { ...prev, success: prev.success + 1, current: prev.current + 1 } : null);
          success = true;

        } catch (err: any) {
          console.error(`Processing ${file.name} (Attempt ${attempts}) failed:`, err);
          
          const isRateLimit = 
            err?.status === 429 || 
            err?.code === 429 || 
            (err?.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')));

          if (isRateLimit && attempts < MAX_ATTEMPTS) {
            // Exponential Backoff for the retry, starting at 10 seconds
            const waitTime = 10000 * Math.pow(2, attempts - 1); // 10s, 20s, 40s
            console.warn(`Rate limit hit. Waiting ${waitTime / 1000}s before retrying...`);
            await delay(waitTime);
          } else {
             // Fatal error or max retries reached
             setProcessingStatus(prev => prev ? { ...prev, failed: prev.failed + 1, current: prev.current + 1 } : null);
             break; 
          }
        }
      }
      
      // Apply the base delay AFTER each file is processed (or retries are exhausted),
      // but not for the very last file in the queue.
      if (i < uniqueFilesToProcess.length - 1) {
        await delay(BASE_DELAY_MS);
      }
    }


    setLoading(false);
    event.target.value = '';
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn chắc chắn muốn trục xuất đệ tử này?")) {
      setDisciples(prev => prev.filter(d => d.id !== id));
    }
  };

  const clearFilters = () => {
    setFilterVerdict('ALL');
    setSearchQuery(''); // Updated
    setFilterElement('ALL');
  };

  const filteredAndSortedDisciples = useMemo(() => {
    let result = [...disciples];

    if (filterVerdict !== 'ALL') {
      result = result.filter(d => d.verdict === filterVerdict);
    }

    if (filterElement === 'SINGLE') {
      // Logic for single element: filter out MIXED. Keep other specific elements.
      result = result.filter(d => d.primaryElement !== ElementType.MIXED);
    } else if (filterElement === 'MIXED') {
      result = result.filter(d => d.primaryElement === ElementType.MIXED);
    } else if (Object.values(ElementType).includes(filterElement as ElementType)) {
      // Filter by specific element type if selected
      result = result.filter(d => d.primaryElement === filterElement);
    }

    if (searchQuery.trim()) { // Use searchQuery for multi-attribute search
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(lowerQuery) ||
        d.originClass.toLowerCase().includes(lowerQuery) || // Search by originClass
        d.analysis.toLowerCase().includes(lowerQuery) ||
        d.traits.some(t => t.name.toLowerCase().includes(lowerQuery)) ||
        d.skills.some(s => s.name.toLowerCase().includes(lowerQuery))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'SCORE_DESC':
          return (b.score || 0) - (a.score || 0);
        case 'POTENTIAL_DESC':
          return b.stats.potential - a.stats.potential;
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [disciples, filterVerdict, searchQuery, filterElement, sortBy]); // Updated dependency

  // --- RENDER WELCOME SCREEN ---
  if (!currentFileName) {
    return (
      <div className="min-h-screen bg-sect-dark flex items-center justify-center p-4 font-sans text-slate-200">
        <div className="max-w-md w-full bg-sect-panel p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sect-green to-sect-gold mb-2">
              Hộ Pháp Tông Môn
            </h1>
            <p className="text-slate-400 text-sm">Quản lý danh sách đệ tử & Tối ưu đội hình</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Tên Hồ Sơ / Server</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  placeholder="VD: Server 1, Acc Chính..."
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-4 py-2 focus:ring-2 focus:ring-sect-gold outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFile()}
                />
                <button 
                  onClick={handleCreateNewFile}
                  className="bg-sect-gold hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded transition-colors"
                >
                  Tạo/Mở
                </button>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">Hoặc</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <div>
              <label className="block w-full cursor-pointer bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 rounded py-3 text-center transition-colors group">
                <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
                <span className="text-slate-400 group-hover:text-sect-green flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Nhập từ file .JSON
                </span>
              </label>
            </div>
            
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-xs text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN APP ---
  return (
    <div className="min-h-screen bg-sect-dark text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
             <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sect-green to-sect-gold">
                  Hộ Pháp Tông Môn
                </h1>
                <div className="flex items-center gap-2 mt-2">
                    <label htmlFor="discipleLimit" className="text-xs text-slate-400">Giới hạn đệ tử:</label>
                    <input
                        id="discipleLimit"
                        type="number"
                        value={discipleLimit}
                        onChange={(e) => setDiscipleLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-20 text-center focus:ring-1 focus:ring-sect-gold focus:outline-none"
                    />
                </div>
             </div>
            
            <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700">
               <div className="px-3">
                 <span className="block text-[10px] text-slate-500 uppercase font-bold">Hồ sơ hiện tại</span>
                 <span className="font-bold text-sect-gold">{currentFileName}</span>
               </div>
               <div className="h-8 w-px bg-slate-600"></div>
               <button 
                 onClick={handleExportJSON}
                 className="p-2 text-slate-400 hover:text-sect-green hover:bg-slate-700 rounded"
                 title="Xuất file JSON"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
               </button>
               <button 
                 onClick={handleSwitchFile}
                 className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                 title="Đổi hồ sơ / Đăng xuất"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
               </button>
            </div>
          </div>
          
          <p className="text-slate-400 text-center max-w-2xl mx-auto hidden md:block">
            Tải lên tối đa 100 ảnh đệ tử. AI sẽ tự động loại bỏ ảnh trùng lặp.
          </p>
        </header>

        <div className="mb-12">
           {loading && processingStatus ? (
             <div className="bg-sect-panel rounded-2xl p-8 border border-slate-700 shadow-lg">
                <div className="text-center mb-4">
                   <h3 className="text-xl font-bold text-white mb-1">Đang thẩm định hồ sơ...</h3>
                   <p className="text-slate-400 text-sm">
                     Đã xử lý {processingStatus.current}/{processingStatus.total} ảnh
                   </p>
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-4 mb-6 overflow-hidden border border-slate-700">
                   <div 
                     className="bg-sect-green h-full transition-all duration-300 ease-out"
                     style={{ width: `${(processingStatus.current / processingStatus.total) * 100}%` }}
                   ></div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                   <div className="bg-emerald-900/30 p-2 rounded border border-emerald-500/30 text-emerald-400">
                     <div className="font-bold text-lg">{processingStatus.success}</div>
                     Thành công
                   </div>
                   <div className="bg-blue-900/30 p-2 rounded border border-blue-500/30 text-blue-400">
                     <div className="font-bold text-lg">{processingStatus.duplicates}</div>
                     Trùng lặp (Bỏ qua)
                   </div>
                   <div className="bg-red-900/30 p-2 rounded border border-red-500/30 text-red-400">
                     <div className="font-bold text-lg">{processingStatus.failed}</div>
                     Thất bại
                   </div>
                </div>
             </div>
           ) : (
             <div className="relative border-2 border-dashed border-slate-600 bg-sect-panel rounded-2xl p-8 text-center hover:border-sect-green transition-colors group cursor-pointer shadow-lg">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-4 pointer-events-none">
                  <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-sect-green group-hover:text-black transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Tải ảnh đệ tử lên (Batch)
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Chọn tối đa 100 ảnh cùng lúc. Tự động lọc trùng.</p>
                  </div>
                </div>
             </div>
           )}
           
           {error && (
             <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-center text-sm">
               {error}
             </div>
           )}
        </div>

        {disciples.length > 0 && (
          <>
            <DisciplesOverview disciples={disciples} /> {/* New component */}
            <TeamSuggestion disciples={disciples} limit={discipleLimit} />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <div className="flex items-center gap-4">
                 <h2 className="text-xl font-bold text-white shrink-0">Danh Sách ({filteredAndSortedDisciples.length}/{disciples.length})</h2>
                 {disciples.length > 0 && (
                    <button 
                      onClick={() => {
                         if(window.confirm('Xóa toàn bộ danh sách đệ tử trong hồ sơ này?')) setDisciples([]);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 underline shrink-0"
                    >
                      Xóa tất cả
                    </button>
                 )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                 <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={searchQuery} // Use searchQuery
                    onChange={(e) => setSearchQuery(e.target.value)} // Use setSearchQuery
                    placeholder="Tìm kiếm..." // Updated placeholder
                    className="bg-slate-900 border border-slate-600 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-sect-green focus:outline-none w-28 md:w-36 placeholder-slate-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    value={filterVerdict}
                    onChange={(e) => setFilterVerdict(e.target.value)}
                    className="bg-slate-900 border border-slate-600 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-sect-green focus:outline-none"
                  >
                    <option value="ALL">Tất cả Loại</option>
                    <option value="RECRUIT">Nên Chiêu Mộ</option>
                    <option value="KEEP_WORKER">Nô Lệ/Thợ</option>
                    <option value="REJECT">Trục Xuất</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    value={filterElement}
                    onChange={(e) => setFilterElement(e.target.value)}
                    className="bg-slate-900 border border-slate-600 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-sect-green focus:outline-none"
                  >
                    <option value="ALL">Tất cả Hệ</option>
                    <option value="SINGLE">Đơn Hệ (Thuần)</option>
                    <option value="MIXED">Tạp (Phế)</option>
                    {/* Add specific element options */}
                    <option value={ElementType.METAL}>Kim</option>
                    <option value={ElementType.WOOD}>Mộc</option>
                    <option value={ElementType.WATER}>Thủy</option>
                    <option value={ElementType.FIRE}>Hỏa</option>
                    <option value={ElementType.EARTH}>Thổ</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-900 border border-slate-600 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-sect-green focus:outline-none"
                  >
                    <option value="SCORE_DESC">Điểm cao nhất</option>
                    <option value="POTENTIAL_DESC">Tiềm Lực</option>
                    <option value="NAME_ASC">Tên A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredAndSortedDisciples.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
                <p className="text-slate-500">Không tìm thấy đệ tử nào phù hợp với bộ lọc.</p>
                <button 
                  onClick={clearFilters}
                  className="mt-2 text-sect-green hover:underline text-sm font-bold"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedDisciples.map(disciple => (
                  <DiscipleCard 
                    key={disciple.id} 
                    disciple={disciple} 
                    onDelete={handleDelete} 
                  />
                ))}
              </div>
            )}
          </>
        )}

        {disciples.length === 0 && !loading && (
          <div className="text-center text-slate-600 py-12 bg-slate-800/30 rounded-xl border border-slate-800">
             <p>Chưa có dữ liệu trong hồ sơ "{currentFileName}".</p>
             <p className="text-sm mt-2">Hãy tải ảnh đệ tử đầu tiên lên để bắt đầu xây dựng môn phái.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;