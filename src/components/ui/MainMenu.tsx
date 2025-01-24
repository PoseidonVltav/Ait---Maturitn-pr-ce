import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MainMenuProps {
  user: any;
  isBusinessOwner: boolean;
  isAdmin: boolean;
  onClose: () => void;
  businessProfileId: string | null;
  onViewBusiness: () => void;
}

const MainMenu = ({ user, isBusinessOwner, isAdmin, onClose, businessProfileId, onViewBusiness }: MainMenuProps) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-64 bg-primary-dark rounded-lg shadow-lg py-2 z-50">
      <button
        onClick={() => handleNavigation('/')}
        className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-primary-medium"
      >
        Domů
      </button>
      
      {user && (
        <>
          <button
            onClick={() => handleNavigation('/account/settings')}
            className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-primary-medium"
          >
            Nastavení účtu
          </button>
          
          {isBusinessOwner && !isAdmin && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-primary-medium">
                Správa podniku
              </div>
              <button
                onClick={() => handleNavigation('/business/editor')}
                className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-primary-medium"
              >
                Editor podniku
              </button>
              {businessProfileId && (
                <button
                  onClick={onViewBusiness}
                  className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-primary-medium"
                >
                  Zobrazit váš podnik
                </button>
              )}
            </>
          )}

          {isAdmin && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 bg-primary-medium">
                Administrace
              </div>
              <button
                onClick={() => handleNavigation('/admin/reports')}
                className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-primary-medium"
              >
                Nahlášené komentáře
              </button>
              <button
                onClick={() => handleNavigation('/admin/businesses')}
                className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-primary-medium"
              >
                Správa podniků
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MainMenu;