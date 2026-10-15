import { validateAccountSyncEnv } from './check-account-sync-env-logic.mjs';

const errors = validateAccountSyncEnv(process.env);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('계정 이전 환경값 이름 검사 통과');
