import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [shouldRender, setRender] = useState(isOpen);

  if (isOpen && !shouldRender) {
    setRender(true);
  }

  const handleAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`bottom-sheet-overlay ${isOpen ? 'open' : 'closed'}`} 
      onClick={onClose}
    >
      <div 
        className={`bottom-sheet ${isOpen ? 'open' : 'closed'}`} 
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="bottom-sheet-drag-handle" onClick={onClose}>
            <div className="bottom-sheet-indicator"></div>
        </div>
        <div className="bottom-sheet-header">
          {title ? <h3 className="bottom-sheet-title">{title}</h3> : <div />}
          <button className="bottom-sheet-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </div>
  );
}
