# 실 스태시 트래커 (Yarn Stash Tracker)

갖고 있는 실 재고를 등록해두면 그 실로 뜰 수 있는 도안을 역으로 추천받는 개인용 뜨개/코바늘 재고 관리 앱입니다. 반대로 마음에 드는 도안을 먼저 찾고 "내가 가진 실 중 이걸로 뜰 수 있는 게 있는지"도 확인할 수 있습니다.

## 핵심 기능

- **실 ↔ 도안 양방향 매칭**: 무게 카테고리(굵기) 일치 + 필요 야드 대비 보유 야드 비율로 여유 있음/충분함/타이트함/부족함 4단계 표시. 게이지 근사치·염색로트(다이로트) 혼합 필요 여부까지 보조로 안내
- **로컬 DB + Ravelry 하이브리드 검색**: 실/도안 등록 시 자체 DB를 우선 조회하고, 없으면 Ravelry API로 폴백 검색 후 선택한 항목만 캐싱
- **게스트 우선 인증**: 로그인 없이 바로 시작 가능하고, 이후 카카오/구글 로그인으로 승격하면 게스트 시절 데이터가 그대로 이관됨
- **프로젝트 트래커**: 도안으로 뜨기를 시작하면 단수 카운터·진행 사진·상태(진행중/완료/보류)로 관리

기능/데이터 모델 배경은 [`docs/실_스태시_트래커_기획서.md`](docs/실_스태시_트래커_기획서.md), 화면별 상세 스펙은 [`docs/실_스태시_트래커_화면설계서.md`](docs/실_스태시_트래커_화면설계서.md)에 정리되어 있습니다.

## 기술 스택

| 영역 | 스택 |
|---|---|
| 프론트엔드 | React 19, Vite, TypeScript, React Router, TanStack Query, Tailwind CSS |
| 백엔드 | Nest.js, Prisma, PostgreSQL |
| 인증 | JWT (localStorage) + 카카오/구글 OAuth |
| 이미지 | Cloudinary (클라이언트 직접 업로드) |
| 외부 연동 | Ravelry API |

## 폴더 구조

```
backend/    Nest.js API 서버 (자세한 내용은 backend/README.md)
frontend/   React 클라이언트 (자세한 내용은 frontend/README.md)
docs/       기획서, 화면설계서, 초기 UI 프로토타입, 개발 착수 프롬프트
```

## 실행 방법

두 서버를 각각 띄워야 합니다.

```bash
# 백엔드
cd backend
npm install
cp .env.example .env   # DATABASE_URL(Neon) 등 채우기
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev

# 프론트엔드 (다른 터미널)
cd frontend
npm install
cp .env.example .env   # 백엔드 API 주소 등 채우기
npm run dev
```

각 폴더의 README에 더 자세한 실행 옵션과 현재 구현 상태가 정리되어 있습니다.

## License

[MIT](LICENSE)
