import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import './SideNavDrawer.css';

export type NavViewMode = 'summary' | 'interceptors' | 'drones';

interface NavOption {
  id: NavViewMode;
  label: string;
}

const NAV_OPTIONS: NavOption[] = [
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
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Floating Trigger Tab at the right edge */}
      <button
        type="button"
        className="side-nav-trigger-tab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="תפריט ניווט"
        title="פתח תפריט ניווט"
      >
        <ChevronLeft size={22} className={`trigger-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {/* Flyout Navigation Menu */}
      <div className={`side-nav-flyout-menu ${isOpen ? 'visible' : ''}`}>
        <ul className="side-nav-list">
          {NAV_OPTIONS.map((option) => {
            const isActive = activeView === option.id;
            return (
              <li key={option.id} className="side-nav-item-wrap">
                <button
                  type="button"
                  className={`side-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelect(option.id)}
                >
                  <span className="nav-btn-label">{option.label}</span>
                  {isActive && (
                    <ChevronLeft size={16} className="active-nav-chevron" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
