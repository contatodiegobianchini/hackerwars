import { dbHelpers } from './supabase.js';

export const db = {
  prepare(query: string) {
    return {
      get(...args: any[]) {
        if (/SELECT role FROM users WHERE id = \?/i.test(query)) {
          const user = dbHelpers.getUserById(String(args[0]));
          return user ? { role: user.role } : undefined;
        }
        return undefined;
      },
      run(...args: any[]) {
        if (/UPDATE users SET role = 'player'/i.test(query)) {
          for (const user of dbHelpers.getAllUsersForAdmin()) {
            if (user.role === 'admin' && user.username.toLowerCase() !== 'diegodev') {
              dbHelpers.updateUserRole(user.id, 'player');
            }
          }
          return { changes: 1 };
        }
        return { changes: 0 };
      },
    };
  },
};
