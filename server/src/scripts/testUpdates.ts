import { GameWorld } from '../engine/GameWorld.js';
import { ProcessEngine } from '../engine/ProcessEngine.js';

async function runTests() {
  console.log('--- Starting Game Engine Verification Tests ---');

  const gameWorld = new GameWorld();
  const processEngine = new ProcessEngine(gameWorld);

  // Setup test user
  const userId = 'test-user-verification-1';
  const player = gameWorld.getPlayer(userId);
  player.cash = 100000; // Ensure enough funds for compilation

  // 1. Test Software Compilation
  const cracker = player.software.find(s => s.type === 'cracker');
  if (!cracker) {
    throw new Error('Test failed: Cracker software not found in player inventory.');
  }
  const initialVersion = cracker.version;
  console.log(`Initial Cracker version: v${initialVersion.toFixed(1)}`);

  const compileResult = processEngine.startProcess(userId, 'compile', {
    softwareId: cracker.id,
    targetFileName: `${cracker.name} v${(initialVersion + 0.1).toFixed(1)}`,
    details: { softwareId: cracker.id }
  });

  if (!compileResult.success || !compileResult.process) {
    throw new Error(`Compile process start failed: ${compileResult.message}`);
  }
  console.log('Compile process started successfully.');

  // Manually complete compile process in engine
  (processEngine as any).handleProcessCompletion(compileResult.process);

  const updatedPlayer = gameWorld.getPlayer(userId);
  const updatedCracker = updatedPlayer.software.find(s => s.id === cracker.id);
  if (!updatedCracker || updatedCracker.version <= initialVersion) {
    throw new Error(`Software version did not update! Expected > ${initialVersion}, got v${updatedCracker?.version}`);
  }
  console.log(`✓ Compile process SUCCESS: Cracker version updated to v${updatedCracker.version.toFixed(1)}`);

  // 2. Test Server Password Cracking
  // Generate procedural target server
  const targetServer = gameWorld.generateProceduralServer(userId);
  targetServer.security.hasherLevel = 1.0; // Ensure cracker level >= target hasher level
  targetServer.security.isBreached = false;

  // Make sure player cracker version is >= target hasher level
  updatedCracker.version = 10.0;

  console.log(`Target server generated: ${targetServer.hostname} (${targetServer.ip})`);
  console.log(`Target initially breached: ${targetServer.security.isBreached}`);

  const crackResult = processEngine.startProcess(userId, 'crack', {
    targetIp: targetServer.ip
  });

  if (!crackResult.success || !crackResult.process) {
    throw new Error(`Crack process start failed: ${crackResult.message}`);
  }
  console.log('Crack process started successfully.');

  // Manually complete crack process in engine
  (processEngine as any).handleProcessCompletion(crackResult.process);

  const finalPlayer = gameWorld.getPlayer(userId);
  const finalServer = gameWorld.getServer(targetServer.ip);

  if (!finalServer?.security.isBreached) {
    throw new Error('Crack process failed: Server security.isBreached is not true.');
  }
  if (!finalPlayer.hackedIps.includes(targetServer.ip)) {
    throw new Error('Crack process failed: Target IP was not added to player.hackedIps.');
  }

  console.log(`✓ Crack process SUCCESS: Server ${targetServer.ip} breached and added to hackedIps.`);
  console.log('--- ALL VERIFICATION TESTS PASSED ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
