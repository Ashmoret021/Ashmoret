import React from 'react';
import {
  Crosshair,
  Radio,
  Zap,
  Shield,
  Rocket,
  Globe,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { InterceptorItem } from '../../types/simulation';
import './EventsPanel.css';

interface EventCardProps {
  item: InterceptorItem;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ item, isSelected, onSelect }) => {
  const renderIcon = () => {
    const size = 18;
    switch (item.icon) {
      case 'crosshair':
        return <Crosshair size={size} />;
      case 'radar':
        return <Radio size={size} />;
      case 'lightning':
        return <Zap size={size} />;
      case 'shield':
        return <Shield size={size} />;
      case 'rocket':
        return <Rocket size={size} />;
      case 'globe':
        return <Globe size={size} />;
      case 'laser':
        return <Sparkles size={size} />;
      case 'grid':
      default:
        return <LayoutGrid size={size} />;
    }
  };

  const isDepleted = item.available === 0;

  return (
    <div
      className={`event-card ${isSelected ? 'selected' : ''} ${isDepleted ? 'depleted' : ''}`}
      onClick={() => onSelect && onSelect(item.id)}
      role="button"
      tabIndex={0}
    >
      {/* Left section: Numeric counter */}
      <div className="card-counter">
        <span className="count-current">{item.available}</span>
        <span className="count-divider">/</span>
        <span className="count-total">{item.total}</span>
      </div>

      {/* Right section: Name, status dot, category, and tactical icon */}
      <div className="card-details">
        <div className="card-main-info">
          <span className={`status-bullet ${item.status}`} />
          <span className="card-name">{item.name}</span>
          <span className="card-category">{item.category}</span>
        </div>
        <div className="card-icon">{renderIcon()}</div>
      </div>
    </div>
  );
};
