#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js가 필요합니다. https://nodejs.org 에서 LTS를 설치한 뒤 다시 실행해 주세요.'
  read -r -p 'Enter 키로 닫기'
  exit 1
fi
node scripts/preview.mjs
