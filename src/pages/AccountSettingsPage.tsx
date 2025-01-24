import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AccountSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user?.email) {
      setNewEmail(user.email);
      
      // Load user metadata
      const { data: metadata } = await supabase
        .from('user_metadata')
        .select('email')
        .eq('id', user.id)
        .single();
        
      if (metadata) {
        setUsername(metadata.email);
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // First verify current password
      const { data: { valid }, error: verifyError } = await supabase.rpc(
        'verify_current_password',
        { user_id: user.id, current_password: currentPassword }
      );

      if (verifyError) throw verifyError;
      if (!valid) {
        setError('Současné heslo není správné');
        return;
      }

      // If current password is correct, update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setSuccess('Heslo bylo úspěšně změněno');
      setNewPassword('');
      setCurrentPassword('');
      setIsEditingPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při změně hesla');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;
      
      // Update user metadata
      const { error: metadataError } = await supabase
        .from('user_metadata')
        .update({ email: newEmail })
        .eq('id', user.id);

      if (metadataError) throw metadataError;

      setSuccess('Email byl úspěšně změněn');
      setIsEditingEmail(false);
      await loadUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při změně emailu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error: metadataError } = await supabase
        .from('user_metadata')
        .update({ email: username })
        .eq('id', user.id);

      if (metadataError) throw metadataError;

      setSuccess('Uživatelské jméno bylo úspěšně změněno');
      setIsEditingUsername(false);
      await loadUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při změně uživatelského jména');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center py-8">Načítání...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nastavení účtu</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-500 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Username Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Uživatelské jméno</h2>
            <button
              onClick={() => setIsEditingUsername(!isEditingUsername)}
              className="text-blue-600 hover:text-blue-700"
            >
              {isEditingUsername ? 'Zrušit' : 'Změnit'}
            </button>
          </div>
          
          {isEditingUsername ? (
            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Současné uživatelské jméno
                </label>
                <p className="mt-1 text-gray-600">{username}</p>
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Nové uživatelské jméno
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Ukládání...' : 'Uložit změny'}
              </button>
            </form>
          ) : (
            <p className="text-gray-600">{username}</p>
          )}
        </div>

        {/* Email Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Email</h2>
            <button
              onClick={() => setIsEditingEmail(!isEditingEmail)}
              className="text-blue-600 hover:text-blue-700"
            >
              {isEditingEmail ? 'Zrušit' : 'Změnit'}
            </button>
          </div>
          
          {isEditingEmail ? (
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Současný email
                </label>
                <p className="mt-1 text-gray-600">{user.email}</p>
              </div>
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                  Nový email
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Ukládání...' : 'Uložit změny'}
              </button>
            </form>
          ) : (
            <p className="text-gray-600">{user.email}</p>
          )}
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Heslo</h2>
            <button
              onClick={() => setIsEditingPassword(!isEditingPassword)}
              className="text-blue-600 hover:text-blue-700"
            >
              {isEditingPassword ? 'Zrušit' : 'Změnit'}
            </button>
          </div>

          {isEditingPassword && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Současné heslo
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nové heslo
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Ukládání...' : 'Uložit změny'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}