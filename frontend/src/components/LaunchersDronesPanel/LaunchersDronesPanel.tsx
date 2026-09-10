import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { LaunchersDroneCard } from './LaunchersDroneCard';
import { DroneGroup, LauncherGroup } from '../../types/types';
import './LaunchersDronesPanel.css';

type EntityGroup = DroneGroup | LauncherGroup;
type GroupTabFilter = 'all' | 'drones' | 'launchers';

interface LaunchersDronesPanelProps {
  groups: EntityGroup[];
  selectedGroupId?: number;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onGroupSelect?: (group: EntityGroup) => void;
  onCreateGroup?: () => void;
}

export const LaunchersDronesPanel: React.FC<LaunchersDronesPanelProps> = ({
  groups,
  selectedGroupId,
  isOpen: controlledIsOpen,
  onToggleOpen,
  onGroupSelect,
  onCreateGroup,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [activeGroupId, setActiveGroupId] = useState<number | undefined>(selectedGroupId);

  useEffect(() => {
    setActiveGroupId(selectedGroupId);
  }, [selectedGroupId]);

  const [tabFilter, setTabFilter] = useState<GroupTabFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isDroneGroup = (group: EntityGroup): group is DroneGroup => {
    return 'drones' in group;
  };

  const handleToggle = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleSelectGroup = (group: EntityGroup) => {
    setActiveGroupId(group.id);
    if (onGroupSelect) {
      onGroupSelect(group);
    }
  };

  // Filtered groups logic
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      // Filter by category tab
      if (tabFilter === 'drones' && !isDroneGroup(group)) return false;
      if (tabFilter === 'launchers' && isDroneGroup(group)) return false;

      // Filter by search query (name or description)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = group.name.toLowerCase().includes(query);
        const matchesDesc = group.description?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [groups, tabFilter, searchQuery]);

  return (
    <aside className={`launchers-drones-panel-wrapper ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Edge toggle tab for collapsing/expanding panel */}
      <button
        type="button"
        className="panel-collapse-tab"
        onClick={handleToggle}
        aria-label={isOpen ? 'סגור תפריט' : 'פתח תפריט'}
        title={isOpen ? 'סגור תפריט' : 'פתח תפריט'}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="launchers-drones-panel-content">
        {/* Top Header: Action Button and Groups Count */}
        <div className="launchers-drones-top-header">
          <button
            type="button"
            className="create-scenario-btn"
            onClick={onCreateGroup}
          >
            <Plus size={15} />
            <span>צור קבוצה</span>
          </button>

          <div className="scenarios-title-block">
            <h3 className="scenarios-heading">
              קבוצות ({groups.length})
            </h3>
            <Layers size={19} className="scenarios-icon" />
          </div>
        </div>

        {/* Scrollable list of DroneGroup / LauncherGroup cards */}
        <div className="scenarios-card-list">
          {filteredGroups.map((group) => (
            <LaunchersDroneCard
              key={group.id}
              group={group}
              isSelected={activeGroupId === group.id}
              onSelect={handleSelectGroup}
            />
          ))}

          {filteredGroups.length === 0 && (
            <div className="no-scenarios-empty">
              <span>לא נמצאו קבוצות התואמות את הסינון</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};