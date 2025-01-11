import React, { useState } from 'react';
import UserTypeSelection from './UserTypeSelection';
import LoginFormFields from './LoginFormFields';
import { UserType } from '../../types/auth';

const LoginForm = () => {
  const [userType, setUserType] = useState<UserType | null>(null);

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
  };

  const handleBack = () => {
    setUserType(null);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        {userType ? 'Přihlásit se jako' : 'Vyberte typ účtu'}
      </h2>
      
      {!userType ? (
        <UserTypeSelection onSelect={handleUserTypeSelect} />
      ) : (
        <div className="space-y-4">
          <div className="text-center text-lg font-medium text-gray-700 mb-4">
            {userType === 'business' ? 'Podnikatel' : 'Uživatel'}
          </div>
          <LoginFormFields userType={userType} />
          <button
            onClick={handleBack}
            className="w-full py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Zpět na výběr typu účtu
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginForm;