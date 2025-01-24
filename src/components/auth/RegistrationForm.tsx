import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType, SubscriptionPlan } from '../../types/auth';
import UserTypeSelection from './UserTypeSelection';
import { supabase } from '../../lib/supabaseClient';

const SUBSCRIPTION_PLANS = [
  { id: 'one_month', name: 'Měsíční', price: '299 Kč', period: 'měsíčně' },
  { id: 'six_months', name: 'Půlroční', price: '1499 Kč', period: '6 měsíců', savings: '305 Kč' },
  { id: 'one_year', name: 'Roční', price: '2699 Kč', period: 'ročně', savings: '889 Kč' }
];

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    if (type === 'user') {
      setStep(2);
    } else {
      setStep(2);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep(3);
  };

  const handleSkipPlan = () => {
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      setUserType(null);
    }
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
      // Register user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_type: userType,
            subscription_plan: selectedPlan
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // If registering as business, create business record
        if (userType === 'business') {
          const { error: businessError } = await supabase
            .from('businesses')
            .insert([{ user_id: authData.user.id }]);

          if (businessError) throw businessError;
        }
      }

      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při registraci');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <UserTypeSelection onSelect={handleUserTypeSelect} />;
      case 2:
        if (userType === 'business') {
          return (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-center">Vyberte plán</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                    onClick={() => handlePlanSelect(plan.id as SubscriptionPlan)}
                  >
                    <h4 className="text-lg font-semibold">{plan.name}</h4>
                    <p className="text-2xl font-bold text-blue-600 my-2">{plan.price}</p>
                    <p className="text-gray-600">{plan.period}</p>
                    {plan.savings && (
                      <p className="text-green-600 text-sm mt-2">Ušetříte {plan.savings}</p>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleSkipPlan}
                className="w-full py-2 text-gray-600 hover:text-gray-800"
              >
                Přeskočit výběr plánu
              </button>
            </div>
          );
        }
        return renderRegistrationForm();
      case 3:
        return renderRegistrationForm();
      default:
        return null;
    }
  };

  const renderRegistrationForm = () => (
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

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Zpět
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Registrace...' : 'Registrovat'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        {step === 1 ? 'Vyberte typ účtu' : 
         step === 2 && userType === 'business' ? 'Vyberte plán' : 
         'Registrace'}
      </h2>
      {renderStep()}
    </div>
  );
};

export default RegistrationForm;