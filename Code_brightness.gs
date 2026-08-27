/**
 * 별의 밝기 워크시트 - 답안 저장용 Apps Script
 *
 * [설치 방법]
 * 1. 새 Google 스프레드시트를 만든다 (시차 워크시트와는 별도 시트 권장).
 * 2. 메뉴 [확장 프로그램] > [Apps Script]를 연다.
 * 3. 기본 코드를 지우고 이 파일 내용 전체를 붙여넣는다.
 * 4. 상단 [배포] > [새 배포] > 유형: "웹 앱" 선택
 *    - 실행 계정: 나(본인)
 *    - 액세스 권한이 있는 사용자: 모든 사용자 (익명 학생 접속 허용용)
 * 5. 배포 후 나오는 웹 앱 URL을 복사해서
 *    brightness.html의 APPS_SCRIPT_URL 값에 붙여넣는다.
 * 6. 처음 배포 시 Google이 권한 승인을 요구하면 승인한다.
 */

const SHEET_NAME = "밝기_답안";
const HEADER = ["제출시각", "반", "번호", "이름",
                "거리(한칸,cm)", "거리(네칸,cm)", "거리(아홉칸,cm)",
                "넓이-거리관계", "밝기-거리관계",
                "확인문제1-선택", "확인문제2-선택",
                "개념-1등급", "개념-6등급", "개념-100배", "개념-2.5배", "개념-10pc",
                "OX1", "OX2", "OX3",
                "겉보기밝기순서", "실제밝기순서", "드래그시뮬최종상태",
                "큰개자리-4.1", "큰개자리-2.0", "큰개자리--1.4",
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
      data.stuClass || "",
      data.stuNumber || "",
      data.name || "",
      data.distOne || "",
      data.distFour || "",
      data.distNine || "",
      data.areaDistanceRelation || "",
      data.brightnessRelation || "",
      data.q1Selected || "",
      data.q2Selected || "",
      data.magBright || "",
      data.magDim || "",
      data.mag100x || "",
      data.mag25x || "",
      data.magPcDef || "",
      data.ox1 || "",
      data.ox2 || "",
      data.ox3 || "",
      data.apparentOrder || "",
      data.realOrder || "",
      data.dragFinalState || "",
      data.caniMatch41 || "",
      data.caniMatch20 || "",
      data.caniMatchNeg14 || "",
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
 * GET 요청으로 ?stuClass=9&stuNumber=1&name=홍길동 을 보내면
 * 해당 학생의 가장 최근 제출 행에서 교사피드백 칸을 돌려준다.
 */
function doGet(e) {
  const stuClass = e.parameter.stuClass || "";
  const stuNumber = e.parameter.stuNumber || "";
  const name = e.parameter.name || "";
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  let found = null;
  for (let i = values.length - 1; i >= 1; i--) { // 최신 제출부터 검색
    const row = values[i];
    if (String(row[1]) === String(stuClass) && String(row[2]) === String(stuNumber) && row[3] === name) {
      found = {
        submittedAt: row[0],
        stuClass: row[1],
        stuNumber: row[2],
        name: row[3],
        feedback: row[row.length - 1] // 교사피드백은 항상 마지막 열
      };
      break;
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify(found || { result: "not_found" }))
    .setMimeType(ContentService.MimeType.JSON);
}
