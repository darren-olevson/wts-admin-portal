import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  FileText, 
  Users, 
  Search 
} from 'lucide-react';
import './AppSidebar.css';

function AppSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">WTS Admin Portal</h1>
        <p className="sidebar-subtitle">Operations & Compliance</p>
      </div>
      <nav className="sidebar-nav">
        <Link 
          to="/" 
          className={`nav-item ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link 
          to="/withdrawals" 
          className={`nav-item ${isActive('/withdrawals') ? 'active' : ''}`}
        >
          <ArrowLeftRight size={20} />
          <span>Withdrawals</span>
        </Link>
        <Link 
          to="/documents" 
          className={`nav-item ${isActive('/documents') ? 'active' : ''}`}
        >
          <FileText size={20} />
          <span>Documents</span>
        </Link>
        <Link 
          to="/users/search" 
          className={`nav-item ${isActive('/users') ? 'active' : ''}`}
        >
          <Search size={20} />
          <span>User Search</span>
        </Link>
        <Link 
          to="/users" 
          className={`nav-item ${isActive('/users') && location.pathname === '/users' ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>User Management</span>
        </Link>
      </nav>
    </aside>
  );
}

export default AppSidebar;
