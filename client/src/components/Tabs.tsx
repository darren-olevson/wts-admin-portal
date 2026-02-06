import { useMemo, useState } from 'react';
import './Tabs.css';

export interface TabDefinition {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabDefinition[];
  defaultActiveId?: string;
}

function Tabs({ tabs, defaultActiveId }: TabsProps) {
  const initialActive = useMemo(() => {
    if (defaultActiveId && tabs.some((tab) => tab.id === defaultActiveId)) {
      return defaultActiveId;
    }
    return tabs[0]?.id;
  }, [defaultActiveId, tabs]);

  const [activeId, setActiveId] = useState<string | undefined>(initialActive);

  const activeTab = tabs.find((tab) => tab.id === activeId) || tabs[0];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeId);
    if (event.key === 'ArrowRight') {
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveId(tabs[nextIndex].id);
    }
    if (event.key === 'ArrowLeft') {
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveId(tabs[prevIndex].id);
    }
  };

  if (!activeTab) {
    return null;
  }

  return (
    <div className="tabs">
      <div className="tabs-header" role="tablist" aria-label="User detail tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            className={`tab-button ${tab.id === activeId ? 'active' : ''}`}
            onClick={() => setActiveId(tab.id)}
            onKeyDown={handleKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content" role="tabpanel">
        {activeTab.content}
      </div>
    </div>
  );
}

export default Tabs;
