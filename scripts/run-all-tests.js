import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const testDir = path.resolve(process.cwd(), 'tests');
const files = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.mjs') || f.endsWith('.test.js'))
  .map(f => path.join('tests', f));

console.log(`\n========================================================`);
console.log(`🧪 TALENT PATH SOLUTIONS - AUTOMATED UNIT TEST SUITE`);
console.log(`========================================================`);
console.log(`Discovered ${files.length} test suites:`);
files.forEach(f => console.log(` • ${f}`));
console.log(`--------------------------------------------------------\n`);

const major = parseInt(process.versions.node.split('.')[0], 10);
const minor = parseInt(process.versions.node.split('.')[1], 10);
const supportsStrip = major > 22 || (major === 22 && minor >= 6);

const args = supportsStrip
  ? ['--experimental-strip-types', '--test', ...files]
  : ['--test', ...files];

const child = spawn('node', args, { stdio: 'inherit' });

child.on('exit', (code) => {
  if (code === 0) {
    console.log(`\n✅ ALL UNIT TESTS PASSED SUCCESSFULLY! (Exit code: 0)`);
  } else {
    console.error(`\n❌ SOME TESTS FAILED (Exit code: ${code})`);
  }
  process.exit(code ?? 1);
});
