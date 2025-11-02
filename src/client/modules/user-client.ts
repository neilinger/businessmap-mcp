import { ApiResponse, CurrentUser, User } from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class UserClient extends BaseClientModuleImpl {
  /**
   * Get all users (cached)
   */
  async getUsers(): Promise<User[]> {
    const ttl = this.config.cacheUsersTtl || 300000; // 5 minutes default
    return this.cache.get<User[]>(
      'users:all',
      async () => {
        const response = await this.http.get<ApiResponse<User[]>>('/users');
        return response.data.data;
      },
      ttl
    );
  }

  /**
   * Get a specific user by ID (cached)
   */
  async getUser(userId: number): Promise<User> {
    const ttl = this.config.cacheUsersTtl || 300000; // 5 minutes default
    return this.cache.get<User>(
      `user:${userId}`,
      async () => {
        const response = await this.http.get<ApiResponse<User>>(`/users/${userId}`);
        return response.data.data;
      },
      ttl
    );
  }

  /**
   * Get current logged user data (cached)
   */
  async getCurrentUser(): Promise<CurrentUser> {
    const ttl = this.config.cacheUsersTtl || 300000; // 5 minutes default
    return this.cache.get<CurrentUser>(
      'user:current',
      async () => {
        const response = await this.http.get<ApiResponse<CurrentUser>>('/me');
        return response.data.data;
      },
      ttl
    );
  }
}
