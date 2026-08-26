# 시차 측정 라이브 워크시트

중학교 과학 교과서 「Ⅶ. 별과 우주」 배움활동 "시차 측정하기"를 온라인 라이브 워크시트로 만든 프로젝트입니다.
학생이 웹에서 실험 결과와 정리하기 답을 입력·제출하면 Google 스프레드시트에 자동 저장되고,
교사가 확인 후 개별 피드백을 남길 수 있습니다.

## 파일 구성

- `worksheet.html` — 학생용 워크시트 (기본 실험 + 심화 실험 + 개념정리 + 문제풀이)
- `Code.gs` — Google Apps Script 백엔드 (스프레드시트 저장 / 피드백 조회용)

## 배포 방법

### 1. 답안 저장소(Google Apps Script) 설정
1. 새 Google 스프레드시트 생성
2. [확장 프로그램] → [Apps Script] 열기
3. `Code.gs` 내용 전체 붙여넣기
4. [배포] → [새 배포] → 유형: **웹 앱**
   - 실행 계정: 나
   - 액세스 권한: 모든 사용자
5. 배포 후 나오는 웹 앱 URL 복사

### 2. 워크시트에 URL 연결
`worksheet.html` 안의 아래 줄을 찾아 방금 복사한 URL로 교체합니다.

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/여기에_배포된_웹앱_ID/exec";
```

### 3. 정적 페이지로 배포 (GitHub Pages)
저장소 Settings → Pages → Branch를 `main`(또는 배포용 브랜치), 폴더는 `/ (root)`로 설정하면
`https://<사용자명>.github.io/<저장소명>/worksheet.html` 주소로 학생들에게 공유할 수 있습니다.

## 저작권 안내
`worksheet.html`의 시뮬레이션 iframe은 사이언스제이(sciencej.cafe24.com) 제작물을 임베드합니다.
배포 전 운영자의 임베드 사용 허락을 확인해 주세요.

## 다음 단계 아이디어
- 학생용 "내 피드백 조회" 페이지 (Code.gs의 `doGet` 함수 활용)
- 문제 1(A/B 관측자 문항) 정답 확정 후 자동 채점 로직 추가
