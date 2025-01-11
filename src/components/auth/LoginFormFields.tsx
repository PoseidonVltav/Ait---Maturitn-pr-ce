import React, { useState } from 'react';
import { UserType } from '../../types/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface LoginFormFieldsProps {
  userType: UserType;
}

const LoginFormFields = ({ userType }: LoginFormFieldsProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      // Check user type after login
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      const isBusiness = !businessError && businessData;

      // Validate user type
      if (userType === 'business' && !isBusiness) {
        await supabase.auth.signOut();
        throw new Error('Tento účet není registrován jako podnikatelský');
      }

      if (userType === 'user' && isBusiness) {
        await supabase.auth.signOut();
        throw new Error('Tento účet je registrován jako podnikatelský');
      }

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při přihlášení');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Přihlašování...' : 'Přihlásit se'}
      </button>
    </form>
  );
};

export default LoginFormFields;