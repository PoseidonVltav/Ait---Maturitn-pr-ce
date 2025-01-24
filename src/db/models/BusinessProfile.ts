// Databáze podniků
export interface BusinessProfile {
  id: string;
  businessId: string;  // Reference na podnikatele
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  categories: string[];
  tags: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessProfileCreate extends Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt'> {
  // Fields required for business profile creation
}

export interface SearchOptions {
  query: string;
  categories?: string[];
  city?: string;
  page?: number;
  limit?: number;
}

// Repository pro práci s profily podniků
export class BusinessProfileRepository {
  // Implementace bude záviset na zvolené databázi
  async create(profile: BusinessProfileCreate): Promise<BusinessProfile> {
    throw new Error('Not implemented');
  }

  async findById(id: string): Promise<BusinessProfile | null> {
    throw new Error('Not implemented');
  }

  async findByBusinessId(businessId: string): Promise<BusinessProfile | null> {
    throw new Error('Not implemented');
  }

  async search(options: SearchOptions): Promise<{
    items: BusinessProfile[];
    total: number;
    page: number;
    totalPages: number;
    query: string;
  }> {
    // Implementace vyhledávání
    throw new Error('Not implemented');
  }

  async update(id: string, data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

// Create an instance of the repository to export
export const businessProfileRepository = new BusinessProfileRepository();