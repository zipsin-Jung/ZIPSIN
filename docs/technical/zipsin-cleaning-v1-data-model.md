# 집신청소 v1 데이터·권한 설계 (2026-10-19)

> 상태: 설계 · 로컬 임시 DB 검증용. **운영 Supabase(gczjjbqgdhtmdhcdgttp)에는 아직 적용하지 않음.**
> Preview와 Production이 같은 Supabase 프로젝트를 쓰므로, 이 migration 적용 = 운영 DB 변경이다. 대표 승인 후 SQL Editor로 적용한다.

## 사용자 결정 (2026-10-19)

- 서비스 이름: **집신청소** (cl.zipsin.net, 앱 경로 `/cl`)
- 첫 출시: **앱 결제 없음.** 검수 뒤 손님이 업체에 직접 낸다. 집신은 확정 가격만 기록한다.
- 업체 정하기: **손님이 직접 고른다.** 업체는 수락하거나 거절한다.
- 수수료·방문 견적 비용: 화면에 넣지 않는다(나중에).
- 작업 날 현장 재계산 없음. '예약과 달라요' 버튼 없음.
- 시작할 수 없는 집(쓰레기·화재·누수 등): 사진과 함께 신고 → 집신 확인 → 서로 위약금 없이 취소. 추가요금으로 진행하는 길은 없다.

## 누가 있나

| 역할 | 어떻게 정해지나 |
|---|---|
| 손님 | 집신 계정(휴대전화 인증)으로 로그인한 누구나 |
| 업체 구성원 | 집신 운영자가 만든 업체에 **초대 코드**로 들어온 계정 (`clean_partner_members`) |
| 집신 운영자 | `clean_operators` 표에 SQL로 직접 넣은 계정(대표). 화면으로 추가하지 않는다 |

## 표

| 표 | 내용 | 누가 읽나 |
|---|---|---|
| `clean_operators` | 운영자 계정 | 운영자 본인 |
| `clean_partners` | 업체 이름·종류(업체/개인)·지역·확인 항목·상태(active/suspended/red_card) | 로그인한 누구나(**active만**), 운영자는 전부 |
| `clean_partner_members` | 업체 ↔ 계정 | 본인, 운영자 |
| `clean_partner_invites` | 초대 코드(해시만 저장)·만료·사용 | 운영자 |
| `clean_bookings` | 예약: 사실 입력(jsonb)·등급·인원·시간·**확정 가격**·가격표 버전·구·동·날짜·시작/이삿짐 시간·요청 칩·상태·시각들·업체가 남긴 말·검수 답·사진 공개 동의 | 손님 본인, 운영자. **업체는 표를 직접 못 읽고** RPC `clean_partner_jobs()`로 가려진 값만 |
| `clean_booking_private` | 상세 주소·연락처·손님 메모 | 손님 본인, 운영자 (업체는 RPC로 조건부) |
| `clean_booking_events` | 상태 변경 기록(누가, 무엇을) | 손님 본인, 운영자 |
| `clean_photos` | 사진(예약 전/후·시작 불가·마이페이지 기록·업체 작업 기록), 저장 경로, pending/ready | 아래 '사진' |
| `clean_records` | 마이페이지에 손님이 **직접 남긴** 예전 청소 | 본인만 |
| `clean_visit_requests` | 방문 견적·특수 청소 요청 | 손님 본인, 운영자 |

## 업체가 보는 범위 (`clean_partner_jobs()`)

| 예약 상태 | 구·동·평수·날짜·가격·요청 칩·메모 | 상세 주소·연락처 |
|---|---|---|
| requested (수락 전) | 보임 | **안 보임** |
| accepted · working · done · redo · block_reported | 보임 | 보임 |
| completed · cancelled · declined | 구·동·날짜·작업만 (메모·요청도 가림) | **안 보임** |

## 상태 흐름 (`clean_booking_action()` 하나로만 바뀜, 가격은 어떤 경로로도 안 바뀜)

```
requested ──partner accept──▶ accepted ──partner start──▶ working ──partner finish(완료 사진 1장+)──▶ done
    │                           │  └─partner report_block──▶ block_reported ──operator confirm_block──▶ cancelled
    ├─partner decline─▶ declined │
    └─customer cancel─▶ cancelled◀┘ (accepted에서도 손님 취소 가능)
done ──customer approve(+사진 공개 동의 선택)──▶ completed
done ──customer request_redo──▶ redo ──partner finish──▶ done
```

- 예약 만들기는 **서버가 가격을 계산**한다(`features/zipsin-clean/domain/pricing.ts`). 브라우저가 보낸 가격은 받지 않는다. 서버 액션이 로그인·휴대전화 인증을 확인한 뒤 service_role 전용 RPC `create_clean_booking`을 부른다.
- 한 업체가 같은 날짜·시간에 수락한 예약이 겹치는지는 v1에서 막지 않는다(업체가 거절으로 처리). → 남은 일.

## 사진

- 버킷 `clean-photos`(비공개, 10MB, jpeg/png/webp). 경로 `{올린 사람 uid}/{photo id}.jpg`.
- 브라우저에서 1600px JPEG로 다시 그려 올린다(`lib/zipsin-check/photo-store.ts`의 `preparePhoto`) → 위치정보 등 사진 정보가 빠진다.
- 보기는 서명된 주소(5분)만. 읽을 수 있는 사람:
  - 올린 사람
  - 예약 사진: 그 예약의 손님, 그 업체 구성원, 운영자
  - 손님이 검수 때 **공개 동의**한 예약의 전/후 사진: 로그인한 누구나(업체 고를 때)
  - 마이페이지 기록 사진: 본인만

## 남은 일 (v1에서 하지 않음)

- 알림(문자·카톡) 없음 → 업체는 앱에서 요청을 확인해야 한다.
- 같은 시간 겹치는 예약 막기, 업체 쉬는 날.
- 결제·수수료·방문 견적 비용.
- 업체 '시간 지킴·다시 부름' 비율은 실제 기록이 쌓이기 전에는 보여 주지 않는다.
- 가격표 v0에 임시 값이 있다(등급 배율, 최소 금액, 시간). **실서비스 열기 전 대표님 답으로 바꿔야 한다.**
