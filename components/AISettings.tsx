
import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_SYSTEM_INSTRUCTION } from '../services/geminiService';

interface Props {
  currentInstruction: string;
  onSave: (newInstruction: string) => void;
}

const AISettings: React.FC<Props> = ({ currentInstruction, onSave }) => {
  const [instruction, setInstruction] = useState(currentInstruction);
  const [isOpen, setIsOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInstruction(currentInstruction);
  }, [currentInstruction]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstruction(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    const confirm = window.confirm("Bạn có chắc muốn áp dụng bộ lọc mới? \n\nLƯU Ý: Thay đổi này chỉ áp dụng cho các ảnh TẢI LÊN SAU NÀY. Để đánh giá lại đệ tử cũ, bạn cần xóa danh sách và quét lại.");
    if (confirm) {
      onSave(instruction);
      setIsDirty(false);
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Khôi phục về cài đặt gốc của nhà phát triển?")) {
      setInstruction(DEFAULT_SYSTEM_INSTRUCTION);
      setIsDirty(true);
    }
  };

  const handleExport = () => {
    const blob = new Blob([instruction], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bo_loc_ho_phap.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setInstruction(ev.target.result as string);
        setIsDirty(true);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-sect-panel border border-slate-700 rounded-lg mb-6 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-sect-gold font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          Tiêu Chuẩn Lọc AI (Tùy Chỉnh)
        </div>
        <div className="flex items-center gap-2">
           {isDirty && <span className="text-xs text-yellow-500 italic mr-2">Chưa lưu*</span>}
           <svg className={`w-5 h-5 text-slate-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </button>

      {isOpen && (
        <div className="p-4 bg-slate-900/50 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-2">
            Tại đây bạn có thể dạy AI cách đánh giá đệ tử. Bạn có thể thêm các luật mới như "Luôn giữ đệ tử họ Nguyễn" hoặc điều chỉnh các ngưỡng chỉ số.
          </p>
          
          <textarea
            value={instruction}
            onChange={handleChange}
            className="w-full h-64 bg-slate-950 border border-slate-700 rounded p-3 text-sm text-slate-300 font-mono focus:ring-1 focus:ring-sect-gold outline-none mb-4 resize-y"
            placeholder="Nhập hướng dẫn cho AI..."
          />

          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex gap-2">
              <button 
                onClick={handleExport}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Xuất file
              </button>
              <label className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 cursor-pointer flex items-center gap-1">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImport} 
                  accept=".txt,.json" 
                  className="hidden" 
                />
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                Nhập file
              </label>
              <button 
                onClick={handleReset}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
              >
                Khôi phục mặc định
              </button>
            </div>

            <button 
              onClick={handleSave}
              className={`px-6 py-2 font-bold rounded shadow-lg transition-colors flex items-center gap-2 ${isDirty ? 'bg-sect-gold text-black hover:bg-yellow-500' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
              disabled={!isDirty}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Lưu Tiêu Chuẩn & Kiểm Tra Lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISettings;
