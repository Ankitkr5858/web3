import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DeveloperView from './components/DeveloperView';
import UserView from './components/UserView';
import Login from './components/Login';
import { Code2, Users, LogOut } from 'lucide-react';
import { MetaKeep } from 'metakeep';
import DirectTransfer from './components/DirectTransfer';

const TEST_APP_ID = '3122c75e-8650-4a47-8376-d1dda7ef8c58';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const metakeep = new MetaKeep(TEST_APP_ID);
      const user = await metakeep.getUser();
      setIsLoggedIn(!!user);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const metakeep = new MetaKeep(TEST_APP_ID);
      await metakeep.logout();
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-md p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">MetaKeep Transaction Manager</h1>
            <div className="space-x-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Code2 size={20} />
                Developer
              </Link>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Users size={20} />
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="container mx-auto py-8">
          <Routes>
            <Route path="/" element={<DeveloperView />} />
            <Route path="/execute/:data" element={<UserView />} />
            <Route path="/directTransfer" element={<DirectTransfer/>} />
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;