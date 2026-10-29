/**
 * 과학 교실 워크시트 - 답안 저장용 Apps Script
 *
 * 여러 워크시트(시차 측정하기, 별의 밝기, 별의 색 등)의 제출을 하나의 배포/
 * 스프레드시트로 받아서, 워크시트별로 별도의 시트(탭)에 저장합니다.
 *
 * ▣ 새 워크시트를 추가할 때 이 코드를 고칠 필요가 없습니다.
 * 워크시트가 보내는 payload에 form: "고유이름" 값만 넣으면, 그 이름의 시트
 * 탭이 자동으로 만들어지고 payload에 담긴 필드가 그대로(적은 순서 그대로)
 * 열로 기록됩니다. 나중에 문항을 추가해 필드가 늘어나도 "교사피드백" 열
 * 앞에 새 열이 자동으로 끼워집니다. (반/번호/이름은 항상 맨 앞, 교사피드백은
 * 항상 맨 뒤에 고정됩니다.)
 *
 * 시차/밝기/별색 워크시트처럼 한글로 다듬은 열 이름을 쓰고 싶은 워크시트는
 * 아래 FORMS 객체에 항목을 추가하면 되지만(선택 사항), 그렇게 하지 않아도
 * payload의 필드 이름(예: extendRight)이 그대로 열 제목으로 쓰이며 정상
 * 동작합니다.
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
 *
 * [AI 조사 도우미(Gemini) 설정 — 우주 탐사 워크시트용, 선택 사항]
 * 1. https://aistudio.google.com 에서 무료 API 키를 만든다.
 * 2. Apps Script 왼쪽 [프로젝트 설정(톱니바퀴)] > [스크립트 속성] > [스크립트 속성 추가]
 *    - 속성: GEMINI_API_KEY   값: 방금 만든 키
 *    - (선택) 속성: GEMINI_MODEL  값: 사용할 모델 이름 (비워 두면 gemini-flash-latest)
 * 3. 편집기 위쪽 함수 목록에서 testGemini 를 고르고 [실행] → 권한 승인 창이 뜨면 승인한다.
 *    (외부 서비스 호출 권한을 처음 한 번 승인해야 웹 앱이 동작한다. 실행 로그에 "연결 성공"이 보이면 OK)
 * 4. [배포] > [배포 관리] > 연필 아이콘 > 버전: "새 버전" > [배포]  (URL은 그대로 유지)
 * 키는 이 스크립트 안에만 저장되므로 워크시트(공개 웹페이지)에는 드러나지 않는다.
 * 학생 질문과 답변 요약은 "AI조사_기록" 시트에 남는다.
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
  },
  galaxy: {
    sheetName: "은하_답안",
    header: ["제출시각", "반", "번호", "이름",
             "복습-절대등급", "복습-베텔게우스온도", "복습-가마온도설명",
             "개념-지름", "개념-별의개수", "개념-태양계거리", "개념-위에서본모양", "개념-옆에서본모양",
             "확인문제1-선택", "확인문제2-선택",
             "OX1", "OX2",
             "교사피드백"],
    row: function (data) {
      return [
        data.reviewAbsMag || "", data.reviewBetel || "", data.reviewKilnReason || "",
        data.blankDiameter || "", data.blankStarCount || "", data.blankSunDist || "",
        data.blankTopShape || "", data.blankSideShape || "",
        data.q1Selected || "", data.q2Selected || "",
        data.ox1 || "", data.ox2 || ""
      ];
    }
  }
};

// form 필드가 아예 없는 아주 예전 요청만 시차 워크시트로 간주한다.
// FORMS에 없는 값이라도 그대로 사용해 새 워크시트용 시트를 자동으로 만든다.
function resolveForm_(formKey) {
  return formKey || "parallax";
}

function getSheet_(formKey) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = FORMS[formKey] ? FORMS[formKey].sheetName : formKey;
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0 && FORMS[formKey]) {
    sheet.appendRow(FORMS[formKey].header);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * FORMS에 등록되지 않은(=새로 추가된) 워크시트용: payload의 키를 그대로
 * 열로 써서 기록한다. 처음 제출되면 그 순서 그대로 헤더를 만들고, 이후 새
 * 필드(문항 추가 등)가 생기면 "교사피드백" 앞에 새 열을 끼워 넣는다.
 */
function appendDynamicRow_(sheet, data) {
  const EXCLUDE = ["form", "submittedAt", "stuClass", "stuNumber", "name"];
  const fixedFront = ["반", "번호", "이름"];
  const middleKeys = Object.keys(data).filter(function (k) { return EXCLUDE.indexOf(k) === -1; });

  let header;
  if (sheet.getLastRow() === 0) {
    header = ["제출시각"].concat(fixedFront, middleKeys, ["교사피드백"]);
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
  } else {
    const lastCol = sheet.getLastColumn();
    header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const newKeys = middleKeys.filter(function (k) { return header.indexOf(k) === -1; });
    if (newKeys.length > 0) {
      const feedbackIdx = header.indexOf("교사피드백"); // 0-based
      const insertAt = feedbackIdx === -1 ? header.length : feedbackIdx;
      sheet.insertColumnsBefore(insertAt + 1, newKeys.length);
      sheet.getRange(1, insertAt + 1, 1, newKeys.length).setValues([newKeys]);
      header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }
  }

  const fixedValues = { "반": data.stuClass || "", "번호": data.stuNumber || "", "이름": data.name || "" };
  const row = header.map(function (col) {
    if (col === "제출시각") return new Date();
    if (col === "교사피드백") return "";
    if (fixedValues.hasOwnProperty(col)) return fixedValues[col];
    return data[col] !== undefined ? data[col] : "";
  });
  sheet.appendRow(row);
}

/* ==========================================================
 * AI 조사 도우미 (Gemini API 무료 등급)
 * 워크시트가 { action: "ai", mode: "ask" | "feedback", ... } 를 보내면
 * Gemini에 물어보고 { result, text, sources } 를 돌려준다.
 * ========================================================== */
const AI_MAX_PER_MINUTE = 12;       // 무료 등급 분당 한도를 넘지 않도록 학급 전체 요청을 제한
const AI_LOG_SHEET = "AI조사_기록";

const AI_SYSTEM_PROMPT = [
  "너는 경주여자중학교 3학년 과학 수업의 'AI 조사 도우미'이다.",
  "수업 주제는 '미래에 대한 도전, 우주 탐사 — 우주 탐사의 의의와 인류에게 미치는 영향'이다.",
  "규칙:",
  "1. 항상 한국어로, 중학교 3학년이 이해할 수 있는 쉬운 말로 답한다.",
  "2. 핵심만 3~5개의 짧은 항목(- 로 시작)으로 정리하고, 전체 500자를 넘기지 않는다.",
  "3. 연도·이름·수치는 정확한 것만 쓰고, 확실하지 않으면 '확인이 필요하다'고 밝힌다.",
  "4. 마지막 줄에 학생이 더 찾아볼 수 있는 검색어나 기관(NASA, 한국항공우주연구원 등)을 한 가지 제안한다.",
  "5. 우주·천문·과학기술과 관계없는 질문, 개인정보, 부적절한 내용은 정중히 거절하고 수업 주제로 돌아오도록 안내한다.",
  "6. 학생의 과제를 대신 완성해 주지 말고, 학생이 스스로 정리할 수 있도록 조사의 출발점을 제공한다."
].join("\n");

const AI_FEEDBACK_PROMPT = [
  "너는 경주여자중학교 3학년 과학 수업의 'AI 조사 도우미'이다.",
  "학생이 '우주 탐사의 의의와 인류에게 미치는 영향'을 조사해 정리한 글을 읽고 짧게 피드백한다.",
  "형식: '잘한 점' 1개, '사실 확인'(틀린 내용이 있으면 바로잡고, 없으면 '특별한 오류 없음'), '보완하면 좋을 점' 1~2개.",
  "한국어로, 중학생에게 다정하게, 전체 400자 이내로 쓴다. 학생의 글을 대신 다시 써 주지 않는다."
].join("\n");

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function aiConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    key: (props.getProperty("GEMINI_API_KEY") || "").trim(),
    model: (props.getProperty("GEMINI_MODEL") || "gemini-flash-latest").trim()
  };
}

// 학급 전체 요청 수를 분 단위로 센다 (무료 등급 한도 보호)
function aiAllowed_() {
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return false;
  try {
    const k = "ai_rpm_" + Math.floor(Date.now() / 60000);
    const n = Number(cache.get(k) || 0);
    if (n >= AI_MAX_PER_MINUTE) return false;
    cache.put(k, String(n + 1), 120);
    return true;
  } finally {
    lock.releaseLock();
  }
}

function callGemini_(cfg, system, userText, useSearch) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(cfg.model) + ":generateContent";
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
  };
  if (useSearch) body.tools = [{ google_search: {} }];
  const send = function (withHeader) {
    const res = UrlFetchApp.fetch(withHeader ? url : url + "?key=" + encodeURIComponent(cfg.key), {
      method: "post",
      contentType: "application/json",
      headers: withHeader ? { "x-goog-api-key": cfg.key } : {},
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
    return { code: res.getResponseCode(), body: res.getContentText() };
  };
  let r = send(true);
  // 키를 헤더로 받지 않는 경우를 대비해 주소(?key=)로 한 번 더 시도
  if ((r.code === 400 || r.code === 401 || r.code === 403) && /API[_ ]?key/i.test(r.body)) r = send(false);
  return r;
}

/**
 * [선생님용 점검] Apps Script 편집기에서 이 함수를 골라 [실행]하세요.
 * - 처음 실행하면 권한 승인 창이 뜹니다 → 승인해야 AI 조사 도우미가 동작합니다.
 * - 아래 [실행 로그]에 키 설정과 Gemini 연결 결과가 표시됩니다.
 */
function testGemini() {
  const cfg = aiConfig_();
  if (!cfg.key) {
    Logger.log("❌ 스크립트 속성 GEMINI_API_KEY 를 찾지 못했습니다. [프로젝트 설정] > [스크립트 속성]에서 이름(대소문자)을 확인하세요.");
    return;
  }
  Logger.log("키 확인: " + cfg.key.slice(0, 3) + "… (길이 " + cfg.key.length + "자), 모델: " + cfg.model);
  const r = callGemini_(cfg, "한국어로 한 문장만 답하라.", "연결 테스트입니다. 인사해 주세요.", false);
  if (r.code === 200) {
    const out = JSON.parse(r.body);
    const parts = ((((out.candidates || [])[0] || {}).content || {}).parts || []);
    Logger.log("✅ 연결 성공! Gemini의 답: " + parts.map(function (p) { return p.text || ""; }).join(""));
    Logger.log("이제 [배포] > [배포 관리] > 연필 > 새 버전 > [배포]를 하면 워크시트에서 사용할 수 있습니다.");
  } else {
    Logger.log("❌ Gemini 오류 " + r.code + ": " + r.body.slice(0, 600));
    if (r.code === 404) Logger.log("→ 모델 이름 문제일 수 있습니다. 스크립트 속성 GEMINI_MODEL 에 gemini-2.5-flash 등을 넣어 보세요.");
    if (r.code === 400 || r.code === 401 || r.code === 403) Logger.log("→ 키 값이 정확한지(앞뒤 공백 없이 전체 복사) 확인하세요.");
    if (r.code === 429) Logger.log("→ 무료 사용량이 잠시 꽉 찼습니다. 1분 뒤 다시 실행해 보세요.");
  }
}

function handleAi_(data) {
  const cfg = aiConfig_();
  if (!cfg.key) return json_({ result: "error", code: "no_key", message: "선생님이 아직 AI 기능을 설정하지 않았어요." });

  const mode = data.mode === "feedback" ? "feedback" : "ask";
  const topic = String(data.topic || "").slice(0, 60);
  const question = String(data.question || "").trim().slice(0, 400);
  const summary = String(data.summary || "").trim().slice(0, 1500);
  if (mode === "ask" && !question) return json_({ result: "error", code: "empty", message: "질문을 입력해 주세요." });
  if (mode === "feedback" && !summary) return json_({ result: "error", code: "empty", message: "먼저 조사한 내용을 정리해 주세요." });
  if (!aiAllowed_()) return json_({ result: "error", code: "busy", message: "지금 질문이 많이 몰렸어요. 1분쯤 뒤에 다시 시도해 주세요." });

  const system = mode === "ask" ? AI_SYSTEM_PROMPT : AI_FEEDBACK_PROMPT;
  const userText = mode === "ask"
    ? (topic ? "[조사 주제: " + topic + "]\n" : "") + question
    : "[조사 주제: " + (topic || "자유 주제") + "]\n학생이 정리한 글:\n" + summary;

  // 1순위: 구글 검색 근거(출처) 포함 → 안 되면 검색 없이 다시 시도
  let r = callGemini_(cfg, system, userText, mode === "ask");
  if (r.code !== 200 && r.code !== 429 && mode === "ask") r = callGemini_(cfg, system, userText, false);
  if (r.code === 429) return json_({ result: "error", code: "busy", message: "AI 무료 사용량이 잠시 꽉 찼어요. 1분쯤 뒤에 다시 시도해 주세요." });
  if (r.code !== 200) return json_({ result: "error", code: "api", message: "AI 응답을 받지 못했어요. (오류 " + r.code + ")" });

  const out = JSON.parse(r.body);
  const cand = (out.candidates || [])[0] || {};
  const text = ((cand.content || {}).parts || []).map(function (p) { return p.text || ""; }).join("").trim();
  if (!text) return json_({ result: "error", code: "blocked", message: "이 질문에는 답할 수 없어요. 수업 주제와 관련된 질문으로 바꿔 보세요." });

  const sources = [];
  ((cand.groundingMetadata || {}).groundingChunks || []).forEach(function (c) {
    if (c.web && c.web.uri && sources.length < 5) sources.push({ title: c.web.title || c.web.uri, uri: c.web.uri });
  });

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let log = ss.getSheetByName(AI_LOG_SHEET);
    if (!log) {
      log = ss.insertSheet(AI_LOG_SHEET);
      log.appendRow(["시각", "반", "번호", "이름", "종류", "주제", "질문/정리한 글", "AI 답변"]);
      log.setFrozenRows(1);
    }
    log.appendRow([new Date(), data.stuClass || "", data.stuNumber || "", data.name || "",
                   mode === "ask" ? "질문" : "피드백", topic, mode === "ask" ? question : summary, text.slice(0, 1000)]);
  } catch (logErr) { /* 기록 실패는 답변에 영향을 주지 않는다 */ }

  return json_({ result: "success", text: text, sources: sources });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "ai") return handleAi_(data);
    const formKey = resolveForm_(data.form);
    const sheet = getSheet_(formKey);

    if (FORMS[formKey]) {
      sheet.appendRow([
        new Date(),
        data.stuClass || "",
        data.stuNumber || "",
        data.name || ""
      ].concat(FORMS[formKey].row(data), [""])); // 마지막 칸: 교사피드백, 처음엔 비워둠
    } else {
      appendDynamicRow_(sheet, data);
    }

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
  // 워크시트가 AI 조사 도우미를 쓸 수 있는지 확인할 때 사용
  if (e.parameter.action === "ai_status") {
    const cfg = aiConfig_();
    return json_({ ai: !!cfg.key, model: cfg.key ? cfg.model : "" });
  }
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
