import { execSync } from 'child_process';
import assert from 'assert';
import path from 'path';

console.log('--- Starting JWT Secret Validation Security Tests ---');

const serverDir = path.resolve(process.cwd(), 'server');
const baseEnv = {
  ...process.env,
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://dummy.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_supabase_service_role_key_for_testing'
};

// Test 1: Missing JWT_SECRET should throw error
try {
  execSync('npx tsx -e "delete process.env.JWT_SECRET; import(\'./src/index.js\');"', {
    cwd: serverDir,
    env: { ...baseEnv, JWT_SECRET: '' },
    stdio: 'pipe'
  });
  assert.fail('Expected index.ts to throw an error when JWT_SECRET is missing');
} catch (err: any) {
  const stderr = err.stderr?.toString() || err.message || '';
  assert(stderr.includes('JWT_SECRET must be configured and contain at least 32 characters'), `Unexpected error message: ${stderr}`);
  console.log('✓ Test 1 PASSED: Missing JWT_SECRET correctly throws configuration error.');
}

// Test 2: Insecure/Short JWT_SECRET (<32 chars) should throw error
try {
  execSync('npx tsx -e "import(\'./src/index.js\');"', {
    cwd: serverDir,
    env: { ...baseEnv, JWT_SECRET: 'short-secret-key-12345' },
    stdio: 'pipe'
  });
  assert.fail('Expected index.ts to throw an error when JWT_SECRET is too short');
} catch (err: any) {
  const stderr = err.stderr?.toString() || err.message || '';
  assert(stderr.includes('JWT_SECRET must be configured and contain at least 32 characters'), `Unexpected error message: ${stderr}`);
  console.log('✓ Test 2 PASSED: Short JWT_SECRET correctly throws configuration error.');
}

// Test 3: Valid JWT_SECRET (>=32 chars) passes JWT validation (progressing past line 13)
try {
  execSync('npx tsx -e "import(\'./src/index.js\');"', {
    cwd: serverDir,
    env: { ...baseEnv, JWT_SECRET: 'a_very_secure_and_long_jwt_secret_key_32bytes_min' },
    stdio: 'pipe'
  });
  console.log('✓ Test 3 PASSED: Valid JWT_SECRET allowed module startup without JWT error.');
} catch (err: any) {
  const stderr = err.stderr?.toString() || err.message || '';
  // Ensure the error was NOT a JWT_SECRET error
  assert(!stderr.includes('JWT_SECRET must be configured'), `JWT_SECRET check unexpectedly failed: ${stderr}`);
  console.log('✓ Test 3 PASSED: Valid JWT_SECRET passed JWT configuration check.');
}

console.log('--- ALL JWT SECRET SECURITY TESTS PASSED ---');
