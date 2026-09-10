import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './SideNavDrawer.css';
export type NavViewMode =
  | 'home'
  | 'scenarios'
  | 'aircraft_dict'
  | 'summary'
  | 'interceptors'
  | 'drones';


interface NavOption {
  id: NavViewMode;
  label: string;
}

const NAV_OPTIONS: NavOption[] = [
  { id: 'home', label: 'מסך בית' },
  { id: 'scenarios', label: 'מאגר תרחישים' },
  { id: 'aircraft_dict', label: 'מילון כלי תעופה' },
  { id: 'summary', label: 'סיכום סימולציות' },
  { id: 'interceptors', label: 'פריסת מיירטים' },
  { id: 'drones', label: 'פריסת רחפנים' },
];

interface SideNavDrawerProps {
  activeView: NavViewMode;
  onViewChange: (view: NavViewMode) => void;
}

export const SideNavDrawer: React.FC<SideNavDrawerProps> = ({
  activeView,
  onViewChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (viewId: NavViewMode) => {
    onViewChange(viewId);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`side-nav-container ${isOpen ? 'expanded' : ''}`}
    >
      {/* When closed: Top-right tab with ChevronDown */}
      {!isOpen && (
        <button
          type="button"
          className="side-nav-closed-tab"
          onClick={() => setIsOpen(true)}
          aria-label="פתח תפריט ניווט"
          title="פתח תפריט ניווט"
        >
          <ChevronDown size={22} className="trigger-chevron" />
        </button>
      )}

      {/* When open: Floating Navigation Dropdown Menu matching media_1789025444378.png */}
      {isOpen && (
        <div className="side-nav-open-card">
          <ul className="side-nav-options-list">
            {NAV_OPTIONS.map((option) => {
              const isActive = activeView === option.id;
              return (
                <li key={option.id} className="side-nav-item">
                  <button
                    type="button"
                    className={`side-nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelect(option.id)}
                  >
                    <span className="nav-item-text">{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Close button at the bottom of the card with ChevronUp */}
          <button
            type="button"
            className="side-nav-close-bottom-btn"
            onClick={() => setIsOpen(false)}
            aria-label="סגור תפריט ניווט"
            title="סגור תפריט ניווט"
          >
            <ChevronUp size={24} className="close-chevron-icon" />
          </button>
        </div>
      )}
    </div>
  );
};
