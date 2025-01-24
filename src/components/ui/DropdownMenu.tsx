import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DropdownMenuProps {
  isOpen: boolean;
  user: any;
  onLogout: () => void;
  isBusinessOwner: boolean;
}

const DropdownMenu = ({ isOpen, user, onLogout, isBusinessOwner }: DropdownMenuProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 left-0 mt-2 bg-white shadow-lg py-2 z-50 md:hidden">
      <button
        onClick={() => navigate('/')}
        className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
      >
        Domovská stránka
      </button>
      
      {user ? (
        <>
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            <div className="font-medium truncate">
              {user.email}
            </div>
            <div className="text-xs text-gray-500">
              {isBusinessOwner ? 'Podnikatelský účet' : 'Uživatelský účet'}
            </div>
          </div>
          <button
            onClick={() => navigate('/account/settings')}
            className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
          >
            Nastavení účtu
          </button>
          {isBusinessOwner && (
            <button
              onClick={() => navigate('/business/editor')}
              className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
            >
              Editor podniku
            </button>
          )}
          <button
            onClick={onLogout}
            className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
          >
            Odhlásit se
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => navigate('/login')}
            className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
          >
            Přihlášení
          </button>
          <button
            onClick={() => navigate('/register')}
            className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
          >
            Registrace
          </button>
        </>
      )}
    </div>
  );
};

export default DropdownMenu;