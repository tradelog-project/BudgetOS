# 가족 예산 관리 앱 — 설정 가이드

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 에서 계정 생성
2. **New Project** → 프로젝트 이름 입력 → 지역: `ap-northeast-2` (서울)
3. 프로젝트 생성 완료 후 **Settings → API** 에서:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. 환경 변수 설정

`.env.local` 파일을 열고 값을 채워주세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. DB 스키마 적용

Supabase 대시보드 → **SQL Editor** → New Query 에서
`supabase/migrations/001_initial_schema.sql` 전체 내용을 붙여넣고 **Run** 클릭

또는 Supabase CLI 사용:
```bash
npx supabase db push
```

## 4. Supabase Auth 설정

1. **Authentication → Providers** → Email 활성화 확인
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (개발) 또는 배포 URL
   - Redirect URLs: 같은 URL 추가

## 5. 개발 서버 실행

```bash
cd family-budget
npm run dev
```

브라우저에서 `http://localhost:3000` 열기

## 6. 첫 사용 흐름

1. **회원가입** → 이름, 이메일, 비밀번호 입력
2. **그룹 만들기** → 가족 그룹 이름 입력 (예: "홍길동 가족")
3. **초대 코드 공유** → 설정 → 가족 설정에서 8자리 코드 확인
4. 가족 구성원은 **회원가입 → 초대 코드 입력** 으로 참여
5. **설정 탭** → 수입/저축/변동비 예산 입력
6. **고정비 관리** → 보험, 통신비, 대출 등 등록
7. **대시보드** → 오늘 사용 가능 금액 확인
8. **+ 버튼** → 지출 빠르게 입력

## 7. Vercel 배포

```bash
npx vercel
```

Vercel 환경변수에 동일하게 추가:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase Auth → URL Configuration에 Vercel 도메인 추가 필수!

## 화면 구성

| 화면 | 경로 | 설명 |
|------|------|------|
| 대시보드 | `/` | 오늘 사용 가능 금액, 예산 현황 |
| 달력 | `/calendar` | 날짜별 지출 확인, 빠른 입력 |
| 정산 | `/settlement` | 월별 엑셀형 결산 |
| 설정 | `/settings` | 수입/저축/예산 입력 |
| 고정비 | `/fixed-costs` | 고정비 항목 관리 |
| 결제수단 | `/payment-methods` | 카드/현금/계좌 관리 |
| 특별일정 | `/events` | 예정 지출 및 예비비 관리 |
| 가족설정 | `/family` | 구성원 및 초대코드 관리 |
