import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MainMenuProps {
  user: any;
  isBusinessOwner: boolean;
  onClose: () => void;
}

const MainMenu = ({ user, isBusinessOwner, onClose }: MainMenuProps) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="absolute right-16 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
      <button
        onClick={() => handleNavigation('/')}
        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        Domů
      </button>
      
      {user && (
        <>
          <button
            onClick={() => handleNavigation('/account/settings')}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Nastavení účtu
          </button>
          
          {isBusinessOwner && (
            <>
              <button
                onClick={() => handleNavigation('/business/editor')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Editor podniku
              </button>
              <button
                onClick={() => handleNavigation('/business/preview')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Zobrazit váš podnik
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MainMenu;