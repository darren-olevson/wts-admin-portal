import { useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usersApi, User } from '../lib/api';
import './UserSearch.css';

function UserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const results = await usersApi.search(searchQuery);
      setUsers(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Error searching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-search">
      <h1 className="user-search-title">User Search</h1>
      <p className="user-search-subtitle">
        Search by Name, WTS User ID, or Account Number
      </p>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-controls">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, WTS User ID, or Account Number..."
              className="search-input"
            />
          </div>
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {users.length > 0 && (
        <div className="search-results">
          <h2 className="results-title">Search Results ({users.length})</h2>
          <div className="results-list">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/invest/users/${user.id}`}
                className="result-item"
              >
                <div className="result-header">
                  <h3 className="result-name">{user.displayName || user.name}</h3>
                  <span className="result-id">{user.wbClientId || user.id}</span>
                </div>
                <div className="result-details">
                  <span className="result-email">{user.email}</span>
                  <span className="result-account">
                    Account: {user.accountId}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="search-error">
          Error: {error}
        </div>
      )}

      {!loading && !error && searchQuery && users.length === 0 && (
        <div className="no-results">
          No users found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}

export default UserSearch;
