import React, { useState } from 'react';
import { Image as ImageIcon, Type } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function ClipboardItem({ item, onPaste, index, isActive, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const isImage = item.type === 'image';
  
  // Compact styling: py-1 instead of py-2, smaller margin
  const containerClasses = isActive 
    ? "bg-primary text-white shadow-md z-10" 
    : isHovered 
        ? "bg-white/10 text-slate-200" 
        : "text-slate-400 hover:bg-white/5";

  return (
    <div 
      id={`item-${index}`}
      className={`group flex items-center gap-2 px-3 py-1 mx-2 mb-[1px] rounded-sm cursor-default transition-all duration-75 ${containerClasses}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onDoubleClick={() => onPaste(item)}
    >
        {/* Icon (Smaller padding) */}
        <div className={`p-0.5 rounded flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : (isImage ? 'bg-purple-500/20 text-purple-300' : 'bg-primary/20 text-primary')}`}>
            {isImage ? <ImageIcon size={12} /> : <Type size={12} />}
        </div>

        {/* Text Summary */}
        <div className="flex-1 min-w-0 flex items-center justify-between">
             <div className={`text-xs truncate font-medium flex-1 mr-2 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {isImage ? '图片' : item.content.replace(/\n/g, ' ')}
             </div>
             {/* Timestamp only visible on active/hover to save visual noise, or keep really small */}
             <div className={`text-[9px] flex-shrink-0 ${isActive ? 'text-white/70' : 'text-slate-600'}`}>
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: zhCN })}
             </div>
        </div>
    </div>
  );
}