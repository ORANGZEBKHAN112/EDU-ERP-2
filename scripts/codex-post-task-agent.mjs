#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const checks = [
  {
    name: 'TypeScript type check',
    command: 'npm run lint',
    fix: 'npm run lint'
  },
  {
    name: 'Production build',
    command: 'npm run build',
    fix: 'npm run build'
  }
];

console.log('🔎 Codex Post-Task QA Agent');
console.log('Running project health checks for the completed task...\n');

const issues = [];

for (const check of checks) {
  console.log(`▶ ${check.name}`);
  const result = spawnSync(check.command, {
    shell: true,
    stdio: 'inherit',
    env: process.env
  });

  if (result.status === 0) {
    console.log(`✅ ${check.name} passed.\n`);
  } else {
    console.log(`❌ ${check.name} failed.\n`);
    issues.push(check);
  }
}

if (issues.length === 0) {
  console.log('🎉 No project errors detected for this task.');
  process.exit(0);
}

console.log('⚠ Issues detected. Use the following command(s) to fix/verify:');
for (const issue of issues) {
  console.log(`- ${issue.fix}`);
}

process.exit(1);
