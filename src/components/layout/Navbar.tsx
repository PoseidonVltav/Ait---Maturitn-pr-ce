import React, { useState, useEffect } from 'react';
import { Menu, X, User, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import SearchBar from '../ui/SearchBar';
import MainMenu from '../ui/MainMenu';
import BusinessNav from './BusinessNav';
import Logo from '../ui/Logo';

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [businessTimeout, setBusinessTimeout] = useState<{
    isTimeout: boolean;
    reason?: string;
  } | null>(null);
  const [businessProfileId, setBusinessProfileId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsBusinessOwner(false);
        setIsAdmin(false);
        setBusinessTimeout(null);
        setBusinessProfileId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: metadata } = await supabase
          .from('user_metadata')
          .select('is_admin, user_type')
          .eq('id', user.id)
          .single();

        if (metadata) {
          setIsAdmin(metadata.is_admin || false);
          setIsBusinessOwner(metadata.user_type === 'business');

          if (metadata.user_type === 'business') {
            // Get the business profile for this user
            const { data: business } = await supabase
              .from('businesses')
              .select('id')
              .eq('user_id', user.id)
              .single();

            if (business?.id) {
              const { data: profile } = await supabase
                .from('business_profiles')
                .select('id, is_timeout, timeout_reason')
                .eq('business_id', business.id)
                .single();

              if (profile) {
                setBusinessTimeout({
                  isTimeout: profile.is_timeout,
                  reason: profile.timeout_reason
                });
                setBusinessProfileId(profile.id);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    setUser(null);
    setIsBusinessOwner(false);
    setIsAdmin(false);
    setBusinessTimeout(null);
    setBusinessProfileId(null);
  };

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
  };

  const handleUserMenuClick = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleViewBusiness = () => {
    if (businessProfileId) {
      navigate(`/business/${businessProfileId}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="bg-primary-darkest shadow-md relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Logo />

          <div className="flex-1 max-w-xl px-4">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {isBusinessOwner && !isAdmin && (
                  <div className="flex items-center space-x-4">
                    <BusinessNav profileId={businessProfileId} />
                    {businessTimeout?.isTimeout && (
                      <div className="flex items-center text-yellow-300">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span className="text-sm">Podnik pozastaven</span>
                      </div>
                    )}
                  </div>
                )}
                <Menu
                  size={20}
                  className="text-gray-300 hover:text-white cursor-pointer"
                  onClick={handleMenuClick}
                />
                <User
                  size={20}
                  className="text-gray-300 hover:text-white cursor-pointer"
                  onClick={handleUserMenuClick}
                />
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white">
                  Přihlášení
                </Link>
                <Link to="/register" className="bg-primary-light text-white px-4 py-2 rounded-lg hover:bg-primary-lighter">
                  Registrace
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={handleMenuClick}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* User Menu */}
      {user && isUserMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-primary-dark rounded-lg shadow-lg py-2 z-50">
          <div className="px-4 py-2 text-gray-300 border-b border-primary-medium">
            <div className="font-medium truncate">
              {user.email}
            </div>
            <div className="text-xs text-gray-400">
              {isAdmin ? 'Administrátor' : isBusinessOwner ? 'Podnikatelský účet' : 'Uživatelský účet'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-primary-medium"
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
          isAdmin={isAdmin}
          onClose={() => setIsMenuOpen(false)}
          businessProfileId={businessProfileId}
          onViewBusiness={handleViewBusiness}
        />
      )}
    </nav>
  );
}