/**
 * 시차 측정 워크시트 - 답안 저장용 Apps Script
 *
 * [설치 방법]
 * 1. 새 Google 스프레드시트를 만든다.
 * 2. 메뉴 [확장 프로그램] > [Apps Script]를 연다.
 * 3. 기본 코드를 지우고 이 파일 내용 전체를 붙여넣는다.
 * 4. 상단 [배포] > [새 배포] > 유형: "웹 앱" 선택
 *    - 실행 계정: 나(본인)
 *    - 액세스 권한이 있는 사용자: 모든 사용자 (익명 학생 접속 허용용)
 * 5. 배포 후 나오는 웹 앱 URL을 복사해서
 *    worksheet.html의 APPS_SCRIPT_URL 값에 붙여넣는다.
 * 6. 처음 배포 시 Google이 권한 승인을 요구하면 승인한다.
 */

const SHEET_NAME = "답안";
const HEADER = ["제출시각", "반/번호", "이름",
                "팔폄-오른쪽눈", "팔폄-왼쪽눈",
                "팔굽힘-오른쪽눈", "팔굽힘-왼쪽눈",
                "서술형답변",
                "심화-가(굽힘)오른쪽눈", "심화-가(굽힘)왼쪽눈",
                "심화-나(폄)오른쪽눈", "심화-나(폄)왼쪽눈",
                "심화-시차비교설명", "심화-대안측정방법",
                "개념-가까울수록", "개념-멀수록", "개념-거리단어",
                "개념-개월수", "개념-pc값", "개념-관계①", "개념-관계②",
                "XY-연주시차비교", "XY-거리비교",
                "문제1-선택", "문제2-선택", "문제3-거리(pc)",
                "교사피드백"];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet_();

    sheet.appendRow([
      new Date(),
      data.classNo || "",
      data.name || "",
      data.extendRight || "",
      data.extendLeft || "",
      data.bentRight || "",
      data.bentLeft || "",
      data.reflection || "",
      data.ex2BentRight || "",
      data.ex2BentLeft || "",
      data.ex2ExtendRight || "",
      data.ex2ExtendLeft || "",
      data.ex2Reason || "",
      data.ex2AltMethod || "",
      data.blankClose || "",
      data.blankFar || "",
      data.blankDistanceWord || "",
      data.blankMonths || "",
      data.blankPc || "",
      data.blankRel1 || "",
      data.blankRel2 || "",
      data.blankParallaxCompare || "",
      data.blankDistanceCompare || "",
      data.q1Selected || "",
      data.q2Selected || "",
      data.starADistance || "",
      "" // 교사피드백: 처음엔 비워둠, 선생님이 시트에서 직접 채움
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * (선택) 학생이 자신의 피드백을 조회할 때 사용.
 * 예: GET 요청으로 ?classNo=2반15번&name=홍길동 을 보내면
 * 해당 학생의 가장 최근 제출 행에서 교사피드백 칸을 돌려준다.
 * 별도의 "피드백 조회 페이지"를 만들 때 fetch(GET)로 호출하면 된다.
 */
function doGet(e) {
  const classNo = e.parameter.classNo || "";
  const name = e.parameter.name || "";
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  let found = null;
  for (let i = values.length - 1; i >= 1; i--) { // 최신 제출부터 검색
    const row = values[i];
    if (row[1] === classNo && row[2] === name) {
      found = {
        submittedAt: row[0],
        classNo: row[1],
        name: row[2],
        extendRight: row[3],
        extendLeft: row[4],
        bentRight: row[5],
        bentLeft: row[6],
        reflection: row[7],
        feedback: row[row.length - 1] // 교사피드백은 항상 마지막 열
      };
      break;
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify(found || { result: "not_found" }))
    .setMimeType(ContentService.MimeType.JSON);
}
