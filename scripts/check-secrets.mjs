import {execFileSync,spawnSync} from 'node:child_process';
const tracked=execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).filter(file=>!file.startsWith('artifacts/')&&file!=='scripts/check-secrets.mjs');
const patterns=[/SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#]+/i,/sk_live_[A-Za-z0-9]+/,/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/];
const scan=spawnSync('git',['grep','-nI','-E','SUPABASE_SERVICE_ROLE_KEY[[:space:]]*=[[:space:]]*[^[:space:]#]+|sk_live_[A-Za-z0-9]+|-----BEGIN (RSA |EC )?PRIVATE KEY-----','--',...tracked],{encoding:'utf8'});
if(scan.status===0&&scan.stdout.trim()){console.error(scan.stdout);process.exit(1)}
if(scan.status!==0&&scan.status!==1){console.error(scan.stderr);process.exit(scan.status??1)}
console.log(`비밀값 검사 통과: 추적 파일 ${tracked.length}개`);
