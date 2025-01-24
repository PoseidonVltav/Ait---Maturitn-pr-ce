// Databáze podnikatelů
export interface Business {
  id: string;
  email: string;
  password: string; // Hashed password
  subscriptionPlan: 'one_month' | 'six_months' | 'one_year';
  subscriptionEndDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessCreate extends Omit<Business, 'id' | 'createdAt' | 'updatedAt'> {
  // Fields required for business creation
}

// Add your database implementation here
export class BusinessRepository {
  // Implementation will depend on your chosen database
  async create(business: BusinessCreate): Promise<Business> {
    throw new Error('Not implemented');
  }

  async findByEmail(email: string): Promise<Business | null> {
    throw new Error('Not implemented');
  }

  async findById(id: string): Promise<Business | null> {
    throw new Error('Not implemented');
  }
}