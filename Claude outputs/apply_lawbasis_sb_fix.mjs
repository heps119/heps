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

apply(
"| 구체적 상속분 | 2026-11-06: 기여분 반영 1차 배분액에서 특별수익(증여+유증, 보상 인정분 제외) 공제, 0원 하한 | §1008·§1008조의2① 간주상속재산 | 확인(초과특별수익자 재분배 방법은 미계산) |",
"| 구체적 상속분 | 2026-11-07 수정: 간주상속재산(순상속재산+생전증여−인정기여분)을 법정상속분으로 나눈 뒤 본인 특별수익(증여+유증, 보상 인정분 제외) 공제, 0원 하한. (2026-11-06판은 생전증여를 간주상속재산에 합산하지 않아 구체적 상속분 합계가 순상속재산보다 작아지는 오류가 있었음 — 외부 검토로 발견·수정) | §1008·§1008조의2① 간주상속재산 | 확인(초과특별수익자 재분배 방법은 미계산) |",
"law basis row: 구체적 상속분 fix"
);

fs.writeFileSync(path, s, 'utf8');
console.log('law basis updated OK, new length', s.length);
