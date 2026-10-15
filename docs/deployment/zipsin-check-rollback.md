# 집신체크 계정 이전 롤백

- 계정 저장 CTA를 로컬 안내로 되돌리고 `/ck` localStorage·IndexedDB 읽기를 유지한다.
- OAuth 공급자 flag를 false로 내려 새 인증 시작을 막는다.
- migration을 파괴적으로 되돌리지 않는다. 이미 저장된 후보는 소유자가 계속 조회·삭제할 수 있게 한다.
- 실패 manifest와 cleanup queue를 확인하되 주소·연락처·메모 원문을 로그로 남기지 않는다.
- 원인 수정은 후속 migration과 새 배포로 진행한다.
