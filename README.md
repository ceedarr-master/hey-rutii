# 루틴 가이드 앱 — Vercel 배포 안내

정적 HTML 한 장짜리 앱이라 별도 빌드 과정 없이 바로 배포할 수 있어요.

## 방법 A — Vercel CLI (가장 빠름)

1. 터미널에서 이 폴더로 이동
2. Vercel CLI 설치 (한 번만): `npm i -g vercel`
3. 배포: `vercel`
   - 처음 실행하면 로그인 요청 → 브라우저에서 인증
   - "Set up and deploy?" → Yes
   - 나머지는 기본값(Enter)으로 진행해도 됩니다
4. 완료되면 `https://your-project.vercel.app` 같은 URL이 나옵니다
5. 프로덕션 배포로 고정하려면: `vercel --prod`

## 방법 B — vercel.com 대시보드에서 드래그 앤 드롭

1. https://vercel.com/new 접속 후 로그인
2. "Deploy" 섹션에서 이 폴더(`routine-app`)를 통째로 드래그 앤 드롭
3. 자동으로 정적 사이트로 인식되어 배포됩니다

## 방법 C — GitHub 연동 (나중에 계속 수정할 계획이면 추천)

1. 이 폴더로 GitHub 저장소 생성 후 push
2. https://vercel.com/new 에서 해당 저장소 Import
3. 이후 GitHub에 push할 때마다 자동으로 재배포됩니다

---

## 참고: 데이터 저장 방식

이 버전은 브라우저의 `localStorage`에 루틴을 저장합니다.
- 같은 브라우저·같은 기기에서는 새로고침해도 루틴이 유지됩니다
- 다른 기기나 다른 브라우저에서 열면 루틴이 보이지 않습니다 (기기별 저장)
- 여러 기기에서 같은 루틴을 보고 싶다면 나중에 간단한 백엔드(예: Vercel KV, Supabase 등)를 붙이는 방법도 있으니 필요하면 말씀해주세요.
