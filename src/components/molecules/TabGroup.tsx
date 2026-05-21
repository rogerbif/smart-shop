import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabGroupProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export default function TabGroup({
  tabs,
  activeTabId,
  onTabChange,
  className = ''
}: TabGroupProps) {
  return (
    <div className={`tabs-container ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTabId === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
