import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../../types/auth';
import UserTypeSelection from './UserTypeSelection';
import { supabase } from '../../lib/supabaseClient';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
  };

  const handleBack = () => {
    setUserType(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Hesla se neshodují');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      if (authData.user && userType === 'business') {
        const { error: businessError } = await supabase
          .from('businesses')
          .insert([{ user_id: authData.user.id }]);

        if (businessError) throw businessError;
      }

      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při registraci');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        {userType ? 'Registrovat se jako' : 'Vyberte typ účtu'}
      </h2>
      
      {!userType ? (
        <UserTypeSelection onSelect={handleUserTypeSelect} />
      ) : (
        <div className="space-y-4">
          <div className="text-center text-lg font-medium text-gray-700 mb-4">
            {userType === 'business' ? 'Podnikatel' : 'Uživatel'}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Heslo
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Potvrzení hesla
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Registrace...' : 'Registrovat'}
            </button>
          </form>
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

export default RegistrationForm;