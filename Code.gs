/**
 * 과학 교실 워크시트 - 답안 저장용 Apps Script
 *
 * 여러 워크시트(시차 측정하기, 별의 밝기 등)의 제출을 하나의 배포/스프레드시트로
 * 받아서, 워크시트별로 별도의 시트(탭)에 저장합니다. 워크시트를 새로 추가할 때마다
 * 새 배포를 만들 필요 없이, 아래 FORMS 객체에 항목만 추가하면 됩니다.
 *
 * [설치 방법]
 * 1. 새 Google 스프레드시트를 만든다.
 * 2. 메뉴 [확장 프로그램] > [Apps Script]를 연다.
 * 3. 기본 코드를 지우고 이 파일 내용 전체를 붙여넣는다.
 * 4. 상단 [배포] > [새 배포] > 유형: "웹 앱" 선택
 *    - 실행 계정: 나(본인)
 *    - 액세스 권한이 있는 사용자: 모든 사용자 (익명 학생 접속 허용용)
 * 5. 배포 후 나오는 웹 앱 URL을 복사해서, 모든 워크시트 HTML 파일
 *    (worksheet.html, brightness.html 등)의 APPS_SCRIPT_URL 값에
 *    동일하게 붙여넣는다. (하나의 URL을 모든 워크시트가 공유)
 * 6. 처음 배포 시 Google이 권한 승인을 요구하면 승인한다.
 */

const FORMS = {
  parallax: {
    sheetName: "답안",
    header: ["제출시각", "반", "번호", "이름",
             "팔폄-오른쪽눈", "팔폄-왼쪽눈",
             "팔굽힘-오른쪽눈", "팔굽힘-왼쪽눈",
             "서술형답변",
             "심화-가(굽힘)오른쪽눈", "심화-가(굽힘)왼쪽눈",
             "심화-나(폄)오른쪽눈", "심화-나(폄)왼쪽눈",
             "심화-시차비교설명", "심화-대안측정방법",
             "개념-가까울수록", "개념-멀수록", "개념-거리단어",
             "개념-개월수", "개념-pc값", "개념-관계①", "개념-관계②",
             "XY-연주시차비교", "XY-거리비교",
             "문제1-선택", "문제2-거리(pc)",
             "교사피드백"],
    row: function (data) {
      return [
        data.extendRight || "", data.extendLeft || "",
        data.bentRight || "", data.bentLeft || "",
        data.reflection || "",
        data.ex2BentRight || "", data.ex2BentLeft || "",
        data.ex2ExtendRight || "", data.ex2ExtendLeft || "",
        data.ex2Reason || "", data.ex2AltMethod || "",
        data.blankClose || "", data.blankFar || "", data.blankDistanceWord || "",
        data.blankMonths || "", data.blankPc || "", data.blankRel1 || "", data.blankRel2 || "",
        data.blankParallaxCompare || "", data.blankDistanceCompare || "",
        data.q1Selected || "", data.starADistance || ""
      ];
    }
  },
  brightness: {
    sheetName: "밝기_답안",
    header: ["제출시각", "반", "번호", "이름",
             "거리(한칸,cm)", "거리(네칸,cm)", "거리(아홉칸,cm)",
             "넓이-거리관계", "밝기-거리관계",
             "확인문제1-선택", "확인문제2-선택",
             "개념-1등급", "개념-6등급", "개념-100배", "개념-2.5배", "개념-10pc",
             "OX1", "OX2", "OX3",
             "겉보기밝기순서", "실제밝기순서", "드래그시뮬최종상태",
             "큰개자리-4.1", "큰개자리-2.0", "큰개자리--1.4",
             "교사피드백"],
    row: function (data) {
      return [
        data.distOne || "", data.distFour || "", data.distNine || "",
        data.areaDistanceRelation || "", data.brightnessRelation || "",
        data.q1Selected || "", data.q2Selected || "",
        data.magBright || "", data.magDim || "", data.mag100x || "", data.mag25x || "", data.magPcDef || "",
        data.ox1 || "", data.ox2 || "", data.ox3 || "",
        data.apparentOrder || "", data.realOrder || "", data.dragFinalState || "",
        data.caniMatch41 || "", data.caniMatch20 || "", data.caniMatchNeg14 || ""
      ];
    }
  },
  starcolor: {
    sheetName: "별색_답안",
    header: ["제출시각", "반", "번호", "이름",
             "별온도순서", "온도색비교설명",
             "HR정리-반지름효과", "HR정리-온도효과",
             "개념-고온색", "개념-저온색",
             "확인문제1-선택", "확인문제2-선택", "확인문제3-선택",
             "OX1", "OX2", "OX3",
             "교사피드백"],
    row: function (data) {
      return [
        data.starOrder || "", data.starCompareReason || "",
        data.hrRadiusEffect || "", data.hrTempEffect || "",
        data.hotColor || "", data.coldColor || "",
        data.q1Selected || "", data.q2Selected || "", data.q3Selected || "",
        data.ox1 || "", data.ox2 || "", data.ox3 || ""
      ];
    }
  }
};

function resolveForm_(formKey) {
  return FORMS[formKey] ? formKey : "parallax"; // 기존 워크시트는 form 필드가 없으므로 기본값 유지
}

function getSheet_(formKey) {
  const form = FORMS[formKey];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(form.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(form.sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(form.header);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const formKey = resolveForm_(data.form);
    const form = FORMS[formKey];
    const sheet = getSheet_(formKey);

    sheet.appendRow([
      new Date(),
      data.stuClass || "",
      data.stuNumber || "",
      data.name || ""
    ].concat(form.row(data), [""])); // 마지막 칸: 교사피드백, 처음엔 비워둠

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
 * 예: GET 요청으로 ?form=brightness&stuClass=9&stuNumber=1&name=홍길동 을 보내면
 * 해당 학생의 가장 최근 제출 행에서 교사피드백 칸을 돌려준다. (form 생략 시 시차 워크시트 기준)
 * 별도의 "피드백 조회 페이지"를 만들 때 fetch(GET)로 호출하면 된다.
 */
function doGet(e) {
  const formKey = resolveForm_(e.parameter.form);
  const stuClass = e.parameter.stuClass || "";
  const stuNumber = e.parameter.stuNumber || "";
  const name = e.parameter.name || "";
  const sheet = getSheet_(formKey);
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
