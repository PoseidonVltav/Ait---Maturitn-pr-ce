import React, { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import SearchBar from '../ui/SearchBar';
import MainMenu from '../ui/MainMenu';

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        checkBusinessOwner(session.user.id);
      } else {
        setIsBusinessOwner(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      checkBusinessOwner(user.id);
    }
  };

  const checkBusinessOwner = async (userId: string) => {
    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      setIsBusinessOwner(!!business);
    } catch (error) {
      setIsBusinessOwner(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0 font-bold text-xl">
            Logo
          </Link>

          <div className="flex-1 max-w-xl px-4">
            <SearchBar />
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600">
                  Přihlášení
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Registrace
                </Link>
                <User size={20} className="text-gray-300" />
              </>
            ) : (
              <>
                <Menu
                  size={20}
                  className="text-gray-700 hover:text-blue-600 cursor-pointer"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                />
                <User
                  size={20}
                  className="text-gray-700 hover:text-blue-600 cursor-pointer"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                />
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden ml-4 p-2 rounded-lg hover:bg-gray-100"
            aria-label={isMenuOpen ? 'Zavřít menu' : 'Otevřít menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* User Menu */}
      {user && isUserMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            <div className="font-medium truncate">
              {user.email}
            </div>
            <div className="text-xs text-gray-500">
              {isBusinessOwner ? 'Podnikatelský účet' : 'Uživatelský účet'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Odhlásit se
          </button>
        </div>
      )}

      {/* Main Menu */}
      {isMenuOpen && (
        <MainMenu
          user={user}
          isBusinessOwner={isBusinessOwner}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
}