# When2Work

팀원들의 가능한 일정을 입력받아 최적의 회의/협업 시간을 찾아주는 웹 애플리케이션입니다.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-free-3ecf8e?logo=supabase)

---

## 주요 기능

- **방 생성** — 회의 제목, 날짜 범위(최대 7일), 시간 범위를 설정하고 고유 링크 생성
- **드래그 시간 선택** — 클릭·드래그(마우스/터치)로 30분 단위 가능 시간 선택, 직관적인 UI
- **히트맵 결과** — 참여자가 많을수록 진한 색으로 표시되는 시각화 그리드
- **스마트 추천** — 겹치는 시간대를 정확히 분석하여 최적의 회의 시간 자동 추천
- **방 삭제** — 수동 삭제 버튼 + 10일 후 자동 삭제로 데이터 관리
- **다크/라이트 모드** — 시스템 설정 연동 + 수동 전환, localStorage 유지
- **반응형 디자인** — 모바일 터치 드래그 및 스크롤 완벽 지원

---

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| UI 프레임워크 | React 18 + Vite 5 |
| 스타일링 | Tailwind CSS v3 |
| 아이콘 | Lucide React |
| 라우팅 | React Router v6 (HashRouter) |
| 백엔드/DB | Supabase (무료 티어) |
| 배포 | GitHub Pages + GitHub Actions |

---

## 프로젝트 구조

```
when2work/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 자동 배포 워크플로우
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── CreateRoom.jsx      # 방 생성 페이지 (+ Supabase 설정 가이드 내장)
│   │   ├── RoomPage.jsx        # 방 메인 페이지 (시간 입력 탭 / 결과 탭)
│   │   ├── TimeGrid.jsx        # 드래그 선택 그리드 + 히트맵 (select/results 모드)
│   │   ├── ResultsView.jsx     # 히트맵 결과 + 추천 시간대 카드
│   │   ├── Layout.jsx          # 공통 네비게이션 + 푸터
│   │   └── ThemeToggle.jsx     # 다크/라이트 전환 버튼
│   ├── context/
│   │   └── ThemeContext.jsx    # 테마 전역 상태 (Context API)
│   ├── lib/
│   │   └── supabase.js         # Supabase 클라이언트 (미설정 시 mock 반환)
│   ├── utils/
│   │   └── timeUtils.js        # 슬롯 생성, 히트맵 분석, 최적 시간 탐색
│   ├── App.jsx                 # 라우트 정의
│   ├── main.jsx                # 앱 엔트리포인트
│   └── index.css               # Tailwind directives + 커스텀 컴포넌트
├── .env.example                # 환경변수 템플릿
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js              # base URL 설정 포함
```

---

## 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 Supabase 값을 입력합니다 (아래 [Supabase 설정](#supabase-설정) 참고):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_BASE_URL=/when2work/
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## Supabase 설정

> Supabase 없이는 방 생성/데이터 저장이 동작하지 않습니다. 무료 티어로 충분합니다.

### 1. 프로젝트 생성

[supabase.com](https://supabase.com) → **New Project** 생성

### 2. 테이블 생성

Supabase 대시보드 → **SQL Editor** → 아래 쿼리 실행:

```sql
-- 방 테이블
create table rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  dates text[] not null,
  time_start integer not null default 9,
  time_end integer not null default 21,
  created_at timestamptz default now()
);

-- 참여자 가능 시간 테이블
create table availability (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  slots text[] not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Row Level Security (공개 읽기/쓰기 허용)
alter table rooms enable row level security;
alter table availability enable row level security;

create policy "public read rooms"        on rooms        for select using (true);
create policy "public insert rooms"      on rooms        for insert with check (true);
create policy "public delete rooms"      on rooms        for delete using (true);
create policy "public read availability" on availability for select using (true);
create policy "public insert availability" on availability for insert with check (true);
create policy "public update availability" on availability for update using (true);

-- 10일 지난 방 자동 삭제 함수
create or replace function delete_old_rooms()
returns void
language plpgsql
security definer
as $$
begin
  delete from rooms
  where created_at < now() - interval '10 days';
end;
$$;

-- 매일 자정에 자동 삭제 실행 (Supabase Cron 사용)
-- Database → Cron Jobs 메뉴에서 추가:
-- Name: delete_old_rooms
-- Schedule: 0 0 * * * (매일 자정)
-- SQL: select delete_old_rooms();
```

### 4. Cron Job 설정 (자동 삭제)

Supabase 대시보드 → **Database** → **Extensions**에서 `pg_cron` 활성화 후,
**SQL Editor**에서 다음 쿼리 실행:

```sql
-- Cron Job 생성 (매일 자정에 실행)
select cron.schedule(
  'delete-old-rooms',
  '0 0 * * *',
  $$select delete_old_rooms();$$
);
```

> 10일 지난 방은 매일 자정에 자동으로 삭제됩니다. 기간을 변경하려면 위 SQL 함수의 `interval '10 days'` 부분을 수정하세요.

**Cron Job 확인:**
```sql
select * from cron.job;
```

**Cron Job 삭제 (필요시):**
```sql
select cron.unschedule('delete-old-rooms');
```

### 5. API 키 확인

**Project Settings → API** 메뉴에서 복사:

| 항목 | 복사할 값 |
|------|---------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | `anon` `public` 키 |

---

## GitHub Pages 배포

### 1. 레포지토리 생성 및 푸시

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_ID/when2work.git
git push -u origin main
```

### 2. GitHub Secrets 등록

레포지토리 → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret 이름 | 값 |
|-------------|----|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

### 3. GitHub Pages 활성화

레포지토리 → **Settings → Pages → Source** → **GitHub Actions** 선택

이후 `main` 브랜치에 push할 때마다 자동 배포됩니다.

### 4. 레포 이름이 `when2work`가 아닌 경우

**`vite.config.js`** 의 base URL을 수정합니다:

```js
// vite.config.js
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production'
    ? (process.env.VITE_BASE_URL || '/여기에-레포-이름/')  // ← 수정
    : '/',
})
```

또는 `.github/workflows/deploy.yml` 내 `VITE_BASE_URL` 값을 수정합니다:

```yaml
# .github/workflows/deploy.yml
- name: Build
  env:
    VITE_BASE_URL: /your-repo-name/   # ← 수정
```

---

## 사용 흐름

```
1. 방 만들기
   └─ 제목, 날짜 범위(~7일), 시간 범위 설정 → 방 생성

2. 링크 공유
   └─ 생성된 URL을 팀원들에게 전달

3. 각자 시간 입력
   └─ 이름 입력 → 드래그로 가능한 시간 선택 → 저장
   └─ 선택 초기화 버튼으로 쉽게 재선택 가능

4. 결과 확인
   └─ "결과 보기" 탭에서 히트맵 확인
   └─ 겹치는 시간대를 정확히 분석한 추천 시간대 확인
   └─ 최적 시간대는 별(★) 표시로 강조

5. 방 관리
   └─ 필요시 휴지통 버튼으로 즉시 삭제
   └─ 10일 지난 방은 자동 삭제
```

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (localhost:5173)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

---

## 커스텀 도메인 설정 (선택사항)

GitHub Pages 기본 도메인 대신 자신의 도메인을 사용할 수 있습니다.

### 1. DNS 설정 (도메인 제공업체)

**서브도메인 사용 시** (예: `when2work.yourdomain.com`):
```
타입: CNAME
호스트: when2work
값: YOUR_GITHUB_USERNAME.github.io.
```

**루트 도메인 사용 시** (예: `yourdomain.com`):
```
타입: A
호스트: @
값: 185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
```

### 2. GitHub Pages 설정

- Settings → Pages → Custom domain에 도메인 입력
- DNS 체크 완료되면 Enforce HTTPS 활성화

### 3. CNAME 파일

`public/CNAME` 파일에 도메인 입력:
```
when2work.yourdomain.com
```

### 4. Base URL 설정

커스텀 도메인 사용 시 `.env.local`과 `.github/workflows/deploy.yml`의 `VITE_BASE_URL`을 `/`로 설정 (이미 설정됨)

---

## 라이선스

MIT
