import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  FileText, 
  Search, 
  DollarSign,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import './AppSidebar.css';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface ModuleSection {
  module: string;
  icon: React.ReactNode;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const moduleNavigation: ModuleSection[] = [
  {
    module: 'Invest',
    icon: <Wallet size={16} />,
    defaultOpen: true,
    items: [
      { path: '/invest/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { path: '/invest/withdrawals', label: 'Withdrawals', icon: <Wallet size={16} /> },
      { path: '/invest/users/search', label: 'User Search', icon: <Search size={16} /> },
    ],
  },
  {
    module: 'Documents',
    icon: <FileText size={16} />,
    defaultOpen: true,
    items: [
      { path: '/documents', label: 'Document Warehouse', icon: <FileText size={16} /> },
    ],
  },
  {
    module: 'Money Movement',
    icon: <DollarSign size={16} />,
    defaultOpen: true,
    items: [
      { path: '/money-movement/transactions-balances', label: 'Transactions & Balances', icon: <ArrowRightLeft size={16} /> },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    moduleNavigation.forEach((section) => {
      initial[section.module] = section.defaultOpen ?? true;
    });
    return initial;
  });

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isModuleActive = (items: MenuItem[]) => {
    return items.some((item) => isActiveRoute(item.path));
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <DollarSign size={24} className="logo-icon" />
          <h1 className="sidebar-title">WTS Admin</h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        {moduleNavigation.map((section) => {
          const isExpanded = expandedModules[section.module];
          const isActive = isModuleActive(section.items);

          return (
            <div key={section.module} className="nav-section">
              <button
                className={`section-header ${isActive ? 'active' : ''}`}
                onClick={() => toggleModule(section.module)}
              >
                <div className="section-header-left">
                  {section.icon}
                  <span className="section-title">{section.module}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={14} className="chevron" />
                ) : (
                  <ChevronRight size={14} className="chevron" />
                )}
              </button>

              <div className={`section-items ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {section.items.map((item) => {
                  const isItemActive = isActiveRoute(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-item ${isItemActive ? 'active' : ''}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="version-info">
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
