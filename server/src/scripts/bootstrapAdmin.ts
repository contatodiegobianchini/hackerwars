import bcrypt from 'bcryptjs';
import { db, dbHelpers } from '../database/sqlite.js';

const ADMIN_USERNAME = 'Diegodev';
const configuredAdminPassword = process.env.ADMIN_PASSWORD;

if (!configuredAdminPassword || configuredAdminPassword.length < 20) {
  throw new Error('ADMIN_PASSWORD must be configured and contain at least 20 characters.');
}

const ADMIN_PASSWORD: string = configuredAdminPassword;
const now = Date.now();
const existing = dbHelpers.getUserByUsername(ADMIN_USERNAME);

// There must be exactly one admin: Diegodev.
db.prepare("UPDATE users SET role = 'player' WHERE role = 'admin'").run();

action(existing);

function action(user: ReturnType<typeof dbHelpers.getUserByUsername>) {
  if (user) {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
    db.prepare("UPDATE users SET password_hash = ?, role = 'admin', is_banned = 0, ban_reason = NULL WHERE id = ?").run(hash, user.id);
    db.prepare("UPDATE players SET data = json_set(data, '$.role', 'admin', '$.isBanned', false), updated_at = ? WHERE user_id = ?").run(now, user.id);
    console.log('Admin Diegodev updated successfully.');
    return;
  }

  const { userId } = dbHelpers.createUser(ADMIN_USERNAME, bcrypt.hashSync(ADMIN_PASSWORD, 12));
  db.prepare("UPDATE users SET role = 'admin', is_banned = 0, ban_reason = NULL WHERE id = ?").run(userId);
  db.prepare('UPDATE players SET data = json_set(data, \'$.role\', \'admin\', \'$.isBanned\', false), updated_at = ? WHERE user_id = ?').run(now, userId);
  console.log('Admin Diegodev created successfully.');
}
