import React, { useState, useEffect, useRef } from 'react';
import ClipboardItem from './components/ClipboardItem';
import { Search, LayoutGrid, Star, Settings, X, Minus, Trash2, Command, Zap, CornerDownLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const THEMES = [
  { name: 'Blue', color: '#3b82f6', hover: '#2563eb' },
  { name: 'Purple', color: '#8b5cf6', hover: '#7c3aed' },
  { name: 'Emerald', color: '#10b981', hover: '#059669' },
  { name: 'Orange', color: '#f97316', hover: '#ea580c' },
  { name: 'Pink', color: '#ec4899', hover: '#db2777' },
];

const PAGE_SIZE = 50;
const COMPACT_WIDTH = 300;
const EXPANDED_WIDTH = 600;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-400 bg-[#1e1e1e] h-screen">
          <h1 className="text-xl font-bold mb-2">Something went wrong.</h1>
          <pre className="text-xs bg-black/30 p-4 rounded overflow-auto">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white/10 rounded hover:bg-white/20">Reload</button>
        </div>
      );
    }
    return this.props.children; 
  }
}

function MainApp() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [tab, setTab] = useState('all'); 
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [config, setConfig] = useState({ maxItems: 100, startAtLogin: false, themeColor: '#3b82f6', shortcut: 'Ctrl+Shift+V' });
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef(null);
  
  // Resize Debounce Ref
  const resizeTimeoutRef = useRef(null);

  // --- Helper Functions ---

  const loadSettings = async () => {
      try {
        const settings = await window.api.getSettings();
        if (settings) setConfig(settings);
      } catch (e) {
          console.error("Load settings failed", e);
      }
  };

  const saveSettings = async (newConfig) => {
      setConfig(newConfig);
      await window.api.saveSettings(newConfig);
  };

  const loadHistory = async (reset = false) => {
    if (isLoading) return;
    setIsLoading(true);
    
    const offset = reset ? 0 : history.length;
    
    try {
        const data = await window.api.getHistory(PAGE_SIZE, offset);
        if (reset) {
            setHistory(data);
            setHasMore(data.length === PAGE_SIZE);
        } else {
            setHistory(prev => [...prev, ...data]);
            setHasMore(data.length === PAGE_SIZE);
        }
    } catch(e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const scrollToItem = (index) => {
    const element = document.getElementById(`item-${index}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearch(val);
    if (val.trim() === '') {
      loadHistory(true);
    } else {
      const results = await window.api.searchHistory(val);
      setHistory(results);
    }
  };

  const handlePaste = (item) => window.api.pasteItem(item);
  const handleDelete = async (id) => {
      setHistory(prev => prev.filter(i => i.id !== id));
      await window.api.deleteItem(id);
  };
  const handleToggleFavorite = async (id) => {
       setHistory(prev => prev.map(i => i.id === id ? {...i, is_favorite: !i.is_favorite} : i));
       await window.api.toggleFavorite(id);
  };
  const handleClearHistory = async () => {
      if(confirm('确定要清空所有非收藏记录吗？')) {
          setHistory([]);
          await window.api.clearHistory();
          loadHistory(true);
      }
  };

  const handleScroll = (e) => {
      if (search) return; 
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollTop + clientHeight >= scrollHeight - 20) { 
          if (hasMore && !isLoading) {
              loadHistory(false);
          }
      }
  };

  // --- Effects ---

  useEffect(() => {
    loadSettings();
    loadHistory(true); 

    window.api.onUpdate((data) => {
        setHistory(data);
        setSelectedIndex(0);
    });

    window.api.onShow(() => {
        setSelectedIndex(0);
        setSearch(''); 
        if(listRef.current) listRef.current.scrollTop = 0;
        // Reset to compact on show
        window.api.resizeWindow(COMPACT_WIDTH);
    });
  }, []);

  useEffect(() => {
    if (config && config.themeColor) {
        const theme = THEMES.find(t => t.color === config.themeColor) || THEMES[0];
        document.documentElement.style.setProperty('--primary', theme.color);
        document.documentElement.style.setProperty('--primary-hover', theme.hover);
    }
  }, [config]);

  useEffect(() => {
    let result = history || [];
    if (tab === 'favorites') result = result.filter(item => item.is_favorite);
    setFilteredHistory(result);
  }, [history, tab]);

  // Window Resize Logic
  useEffect(() => {
      if (tab === 'settings') {
          // Settings needs space
          window.api.resizeWindow(EXPANDED_WIDTH);
          return;
      }

      // If we have a selection, expand after delay
      if (filteredHistory[selectedIndex]) {
          if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
          
          resizeTimeoutRef.current = setTimeout(() => {
              window.api.resizeWindow(EXPANDED_WIDTH);
          }, 300); // 300ms delay
      } else {
          // No selection? Compact.
          window.api.resizeWindow(COMPACT_WIDTH);
      }

      return () => {
          if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      };
  }, [selectedIndex, tab, filteredHistory]);


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (tab === 'settings') return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => {
            const next = Math.min(prev + 1, filteredHistory.length - 1);
            scrollToItem(next);
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => {
            const next = Math.max(prev - 1, 0);
            scrollToItem(next);
            return next;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredHistory[selectedIndex]) {
            handlePaste(filteredHistory[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          window.api.closeWindow(); 
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredHistory, selectedIndex, tab]);

  const selectedItem = filteredHistory[selectedIndex];

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden border border-white/10 shadow-2xl">
      
      {/* Title Bar */}
      <div className="drag-region h-9 flex items-center justify-between px-3 bg-[#252526] border-b border-black/40 shrink-0">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Zap size={14} className="text-primary" />
            <span>Clipboard Pro</span>
        </div>
        <div className="no-drag flex items-center gap-1">
             <button onClick={() => window.api.minimizeWindow()} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"><Minus size={14} /></button>
             <button onClick={() => window.api.closeWindow()} className="p-1 hover:bg-red-500 rounded text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Tabs) */}
        <div className="w-12 bg-[#252526] flex flex-col items-center py-3 gap-2 border-r border-black/40 shrink-0">
            <SidebarBtn icon={<LayoutGrid size={18} />} active={tab === 'all'} onClick={() => setTab('all')} tooltip="全部" />
            <SidebarBtn icon={<Star size={18} />} active={tab === 'favorites'} onClick={() => setTab('favorites')} tooltip="收藏" />
            <div className="flex-1" />
            <SidebarBtn icon={<Settings size={18} />} active={tab === 'settings'} onClick={() => setTab('settings')} tooltip="设置" />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Settings Page */}
            {tab === 'settings' ? (
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Settings className="text-primary" /> 偏好设置
                    </h2>
                    
                    <div className="space-y-6 max-w-sm">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <label className="text-sm text-slate-300 block mb-2 font-medium">最大历史记录数 (数据库)</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="10"
                                    max="100000"
                                    value={config.maxItems || 100}
                                    onChange={(e) => saveSettings({ ...config, maxItems: parseInt(e.target.value) || 100 })}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-primary text-white"
                                />
                                <span className="text-xs text-slate-500">条</span>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex justify-between items-center">
                            <div>
                                <div className="text-sm text-slate-200 font-medium">开机自动启动</div>
                            </div>
                            <button 
                                onClick={() => saveSettings({ ...config, startAtLogin: !config.startAtLogin })}
                                className={`w-10 h-5 rounded-full relative transition-colors ${config.startAtLogin ? 'bg-primary' : 'bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${config.startAtLogin ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <label className="text-sm text-slate-300 block mb-3 font-medium">主题颜色</label>
                            <div className="flex gap-3">
                                {THEMES.map(t => (
                                    <button
                                        key={t.name}
                                        onClick={() => saveSettings({ ...config, themeColor: t.color })}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${config.themeColor === t.color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: t.color }}
                                        title={t.name}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="pt-4">
                            <button onClick={() => window.api.quitApp()} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors border border-red-500/10">
                                退出应用程序
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Main Split View */
                <>
                    {/* Left: List (Fixed Width 250px now to fit in 300px total with sidebar) */}
                    <div className="w-[250px] flex flex-col border-r border-white/5 bg-[#1e1e1e] shrink-0">
                        <div className="p-2 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-2 top-2 text-slate-500" size={12} />
                                <input 
                                    type="text" 
                                    placeholder="搜索..." 
                                    value={search}
                                    onChange={handleSearch}
                                    className="w-full bg-[#2d2d2d] border border-transparent focus:border-primary rounded px-2 pl-7 py-1 text-xs text-slate-200 focus:outline-none"
                                />
                            </div>
                        </div>
                        
                        <div 
                            className="flex-1 overflow-y-auto custom-scrollbar pt-1" 
                            ref={listRef}
                            onScroll={handleScroll}
                        >
                            {filteredHistory.map((item, idx) => (
                                <ClipboardItem 
                                    key={item.id} 
                                    index={idx}
                                    item={item} 
                                    isActive={idx === selectedIndex}
                                    onClick={() => setSelectedIndex(idx)}
                                    onPaste={handlePaste} 
                                />
                            ))}
                            {isLoading && (
                                <div className="text-center py-2 text-[10px] text-slate-600">加载中...</div>
                            )}
                        </div>
                        
                        <div className="h-6 flex items-center justify-between px-2 bg-[#252526] text-[10px] text-slate-500 border-t border-black/20 shrink-0">
                            <span>{filteredHistory.length} items</span>
                            {tab === 'all' && <button onClick={handleClearHistory} className="hover:text-red-400"><Trash2 size={10} /></button>}
                        </div>
                    </div>

                    {/* Right: Preview Panel (Only visible when Expanded) */}
                    <div className="flex-1 bg-[#1e1e1e] flex flex-col overflow-hidden min-w-0">
                        {selectedItem ? (
                            <div className="flex-1 flex flex-col h-full animate-fade-in">
                                <div className="h-8 flex items-center justify-between px-4 border-b border-white/5 bg-[#252526]/50">
                                    <span className="text-xs text-slate-500">
                                        {formatDistanceToNow(new Date(selectedItem.created_at), { addSuffix: true, locale: zhCN })}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleToggleFavorite(selectedItem.id)} className={`p-1 rounded hover:bg-white/10 ${selectedItem.is_favorite ? 'text-yellow-400' : 'text-slate-500'}`}>
                                            <Star size={14} fill={selectedItem.is_favorite ? "currentColor" : "none"} />
                                        </button>
                                        <button onClick={() => handleDelete(selectedItem.id)} className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-red-400">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {selectedItem.type === 'image' ? (
                                        <div className="flex items-center justify-center min-h-full">
                                            <img src={selectedItem.preview} className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-white/10" />
                                        </div>
                                    ) : (
                                        <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 leading-relaxed selection:bg-primary/30">
                                            {selectedItem.content}
                                        </pre>
                                    )}
                                </div>
                                <div className="p-4 border-t border-white/5">
                                    <button 
                                        onClick={() => handlePaste(selectedItem)}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-primary hover-bg-primary text-white rounded-md text-sm font-medium transition-colors shadow-lg shadow-primary/10"
                                    >
                                        <CornerDownLeft size={16} /> 粘贴到应用
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50">
                                <LayoutGrid size={48} className="mb-4 text-slate-700" />
                                <p className="text-sm">预览区域</p>
                            </div>
                        )}
                    </div>
                </>
            )}

        </div>
      </div>
    </div>
  );
}

function SidebarBtn({ icon, active, onClick, tooltip }) {
    return (
        <button 
            onClick={onClick}
            className={`p-2 rounded-lg transition-all relative group ${active ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            title={tooltip}
        >
            {icon}
            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-primary rounded-r -ml-3"></div>}
        </button>
    )
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
