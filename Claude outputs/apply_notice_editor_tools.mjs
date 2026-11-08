import fs from 'node:fs';

const path = process.argv[2];
let s = fs.readFileSync(path, 'utf8');

function must(old, label) {
  const n = s.split(old).length - 1;
  if (n !== 1) throw new Error(`"${label}" matched ${n} times (expected 1)`);
}
function apply(old, neu, label) {
  must(old, label);
  s = s.replace(old, neu);
}

// 공지사항 편집창에 이미 이 사이트의 다른 곳(헤리티지 노트·FAQ·사례연구 등)에서 쓰고 있는
// 자체 제작 리치 텍스트 에디터(hed-*, TinyMCE 대체, 완전 오프라인)를 그대로 연결한다.
// 새 에디터를 또 만들지 않고 initHedEditor/setTinyVal/hedCleanHtml 등 기존 함수를 재사용해,
// 굵게·기울임·밑줄·목록·정렬·표·링크·이미지·글자색 등 도구를 공지 내용 칸에도 쓸 수 있게 한다.

// 1) 모달 내 "공지 내용" textarea 위에 라벨 추가(다른 입력칸과 통일된 모양).
apply(
`          <textarea id="noticeContent" placeholder="공지 내용" rows="10" style="width:100%; background:#0a1628; border:1px solid rgba(255,255,255,0.12); color:white; padding:0.6rem 0.8rem; font-size:0.88rem; line-height:1.6; font-family:'Noto Sans KR',sans-serif; box-sizing:border-box; resize:vertical; outline:none; margin-bottom:0.7rem;"></textarea>`,
`          <label style="display:block; font-size:0.8rem; color:rgba(255,255,255,0.9); margin-bottom:0.35rem;">공지 내용</label>
          <textarea id="noticeContent" placeholder="공지 내용" rows="10" style="width:100%; background:#0a1628; border:1px solid rgba(255,255,255,0.12); color:white; padding:0.6rem 0.8rem; font-size:0.88rem; line-height:1.6; font-family:'Noto Sans KR',sans-serif; box-sizing:border-box; resize:vertical; outline:none; margin-bottom:0.7rem;"></textarea>`,
"공지 내용 라벨 추가"
);

// 2) 공지 편집 모달 안에서는 툴바 sticky 기준이 페이지 헤더가 아니라 모달 자신이어야 하고,
//    편집창 높이도 적당히 조정한다 — 다른 모달(.hn-form-wrap .hed-toolbar 등)과 같은 패턴.
apply(
`  /* 수정 모달 내 툴바 - 모달 기준 상단 고정 */
  .hn-edit-modal .hed-toolbar { top: 0; }`,
`  /* 수정 모달 내 툴바 - 모달 기준 상단 고정 */
  .hn-edit-modal .hed-toolbar { top: 0; }
  /* 공지사항 편집 모달 내 툴바 */
  #noticeForm .hed-toolbar { top: 0; }
  #noticeForm .hed-editor { min-height: 220px; }`,
"공지 모달용 hed-toolbar/hed-editor CSS 보정"
);

// 3) 리치 에디터로 표를 넣었을 때 테두리가 보이도록, 이미 적용 중인 4곳과 같은 선택자에
//    공지사항 본문 표시 영역(.notice-body-inner)도 추가한다.
apply(
`  .hn-modal-body table, .faq-a-inner table, .sd-body-inner table, .cs-card-result-text table {`,
`  .hn-modal-body table, .faq-a-inner table, .sd-body-inner table, .cs-card-result-text table, .notice-body-inner table {`,
"공지 본문 표 스타일 선택자 추가"
);

// 4) 공용 상세보기 모달(공지사항·사례연구)의 본문 영역에도 같은 클래스 부여.
apply(
`<div id="detailViewBody" style="font-size:0.9rem; color:#333; line-height:1.8;"></div>`,
`<div id="detailViewBody" class="notice-body-inner" style="font-size:0.9rem; color:#333; line-height:1.8;"></div>`,
"상세보기 모달 본문에 notice-body-inner 클래스 추가"
);

// 5) openNoticeForm: 수정 모드 — textarea.value뿐 아니라 리치 에디터도 같이 채운다.
apply(
`titleEl.value = n.title || '';
contentEl.value = n.content || '';
popupEl.checked = !!n.show_as_popup;`,
`titleEl.value = n.title || '';
contentEl.value = n.content || '';
setTinyVal('noticeContent', n.content || '');
initHedEditor('noticeContent');
popupEl.checked = !!n.show_as_popup;`,
"openNoticeForm 수정모드: 리치 에디터 채우기"
);

// 6) openNoticeForm: 새 공지 모드 — 리치 에디터도 같이 비운다.
apply(
`titleEl.value = '';
contentEl.value = '';
popupEl.checked = false;`,
`titleEl.value = '';
contentEl.value = '';
setTinyVal('noticeContent', '');
initHedEditor('noticeContent');
popupEl.checked = false;`,
"openNoticeForm 신규모드: 리치 에디터 비우기"
);

// 7) closeNoticeForm: 리치 에디터도 같이 비운다.
apply(
`document.getElementById('noticeTitle').value = '';
document.getElementById('noticeContent').value = '';
document.getElementById('noticeShowAsPopup').checked = false;`,
`document.getElementById('noticeTitle').value = '';
document.getElementById('noticeContent').value = '';
setTinyVal('noticeContent', '');
document.getElementById('noticeShowAsPopup').checked = false;`,
"closeNoticeForm: 리치 에디터 비우기"
);

// 8) submitNotice: 일반 textarea.value 대신, 리치 에디터가 초기화돼 있으면 그 HTML을
//    읽는다(hedCleanHtml로 편집용 핸들·선택 표시 등 UI 전용 흔적을 제거한 뒤 저장) —
//    다른 글쓰기 폼(hnEditSaveStep1 등)과 동일한 패턴.
apply(
`var content = document.getElementById('noticeContent').value.trim();`,
`var hedNoticeEditor = document.getElementById('hed-noticeContent');
var content = hedNoticeEditor ? hedCleanHtml(hedNoticeEditor.innerHTML).trim() : document.getElementById('noticeContent').value.trim();`,
"submitNotice: 리치 에디터 HTML 읽기"
);

// 9) renderNoticeItem: 미리보기(좁은 칸)는 리치 콘텐츠에서 글자만 뽑아 짧게 보여주고,
//    전체 목록은 더 이상 이스케이프하지 않고(=서식이 실제로 보이도록) HTML 그대로 넣는다.
//    과거(에디터 도입 전)에 작성된 일반 텍스트 공지는 그대로 \n → <br> 처리만 된다.
apply(
`var rawContent = n.content || '';
var contentHtml;
if (dark) {
var flat = rawContent.replace(/\\s+/g, ' ').trim();
var EXCERPT_LEN = 55;
contentHtml = escLite(flat.slice(0, EXCERPT_LEN)) + (flat.length > EXCERPT_LEN ? '…' : '');
} else {
contentHtml = escLite(rawContent).replace(/\\n/g, '<br>');
}`,
`var rawContent = n.content || '';
var contentHtml;
if (dark) {
// 리치 에디터로 쓴 내용(HTML 태그 포함)도 미리보기는 글자만 뽑아서 짧게 보여준다.
var tmpStrip = document.createElement('div');
tmpStrip.innerHTML = rawContent;
var plainText = tmpStrip.innerText || tmpStrip.textContent || '';
var flat = plainText.replace(/\\s+/g, ' ').trim();
var EXCERPT_LEN = 55;
contentHtml = escLite(flat.slice(0, EXCERPT_LEN)) + (flat.length > EXCERPT_LEN ? '…' : '');
} else {
// 전체 목록은 리치 에디터 서식(굵게·목록·표 등)이 그대로 보이도록 이스케이프 없이 넣는다.
contentHtml = rawContent.replace(/\\n/g, '<br>');
}`,
"renderNoticeItem: 리치 콘텐츠 대응"
);

apply(
`'<div style="font-size:0.8rem; color:' + bodyCol + '; line-height:1.6;">' + contentHtml + '</div>' +`,
`'<div class="notice-body-inner" style="font-size:0.8rem; color:' + bodyCol + '; line-height:1.6;">' + contentHtml + '</div>' +`,
"renderNoticeItem: notice-body-inner 클래스 추가"
);

// 10) autoLink: 팝업 배너로도 노출되는 경우, 리치 에디터가 만든 HTML(이미 <a> 태그 등을
//     포함)에 기존의 정규식 자동 링크 변환을 또 적용하면 href 속성 안의 URL 글자까지
//     다시 매치돼 <a> 태그 속성 안에 또 다른 <a>가 끼어들어가 마크업이 깨진다. 이미 HTML
//     태그가 있는 내용(에디터로 작성한 것)은 자동 변환을 건너뛴다 — 링크는 에디터 자체
//     "🔗 링크" 도구로 이미 넣을 수 있으므로 자동 변환이 필요 없다.
apply(
`function autoLink(text) {
// 이메일`,
`function autoLink(text) {
// 리치 에디터로 작성된 내용(이미 HTML 태그 포함)은 아래 정규식 자동 링크 변환을 건너뛴다
// (href 속성 안 URL까지 다시 매치돼 <a> 안에 <a>가 끼어들어 마크업이 깨지는 것을 방지).
if (/<[a-z][\\s\\S]*>/i.test(text)) {
return text.replace(/\\n/g, '<br>');
}
// 이메일`,
"autoLink: 리치 HTML 콘텐츠는 자동 링크 변환 건너뛰기"
);

fs.writeFileSync(path, s, 'utf8');
console.log('notice editor tools applied OK, new length', s.length);
