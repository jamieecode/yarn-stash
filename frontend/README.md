# 실 스태시 트래커 프론트엔드 (React + Vite)

보유한 실 재고를 등록하면 뜰 수 있는 도안을 역으로 추천받고, 반대로 도안 기준으로 맞는 실을 찾을 수 있는 개인용 뜨개/코바늘 재고 관리 앱의 프론트엔드입니다. 기획 배경과 데이터 모델은 [`docs/실_스태시_트래커_기획서.md`](../docs/실_스태시_트래커_기획서.md), 화면별 상세 스펙은 [`docs/실_스태시_트래커_화면설계서.md`](../docs/실_스태시_트래커_화면설계서.md)를 참고하세요.

## 실행 방법

```bash
npm install
cp .env.example .env   # 백엔드 API 주소, Cloudinary/카카오/구글 클라이언트 ID 채우기
npm run dev
```

백엔드(`../backend`)가 먼저 떠 있어야 합니다.

## 기술 스택

- React 19 + Vite + TypeScript
- React Router — URL 기반 라우팅 (등록/상세는 탭바 숨김, 목록은 탭바 노출)
- TanStack Query — 서버 상태 관리/캐싱
- Tailwind CSS
- Cloudinary unsigned upload — 사진은 프론트에서 직접 업로드하고 URL만 백엔드에 저장

## 구조

```
src/
  api/            # TanStack Query 훅 (실/도안/프로젝트/카탈로그)
  auth/           # 세션 컨텍스트, 세션 필요 라우트 가드
  components/
    layout/       # 하단 탭바, 상단바, 목록형/단순형 레이아웃
    yarn/ pattern/ ui/
  lib/            # API 클라이언트, Cloudinary 업로드, 단위 변환 등 유틸
  pages/          # 실/도안/프로젝트/마이 화면 (목록·등록·상세·수정)
```

## 참고

`docs/yarn-stash-prototype.jsx`는 화면 흐름·디자인 토큰을 잡기 위한 초기 UI 스펙북(useState 기반 목업)이며, 실제 구현은 이 폴더(`src/`)의 React Router + TanStack Query 코드가 기준입니다.
