// Databáze uživatelů
export interface User {
  id: string;
  email: string;
  password: string; // Hashed password
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreate extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  // Fields required for user creation
}

// Add your database implementation here
export class UserRepository {
  // Implementation will depend on your chosen database
  async create(user: UserCreate): Promise<User> {
    throw new Error('Not implemented');
  }

  async findByEmail(email: string): Promise<User | null> {
    throw new Error('Not implemented');
  }

  async findById(id: string): Promise<User | null> {
    throw new Error('Not implemented');
  }
}