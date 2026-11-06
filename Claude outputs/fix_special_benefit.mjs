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

// 버그 수정(2026-11-07, 외부 검토로 발견): 특별수익 반영 구체적 상속분 계산이 생전증여를
// 간주상속재산에 합산하지 않고 순상속재산만으로 1차 배분액을 계산한 뒤 특별수익을 빼서,
// 상속인들의 구체적 상속분 합계가 실제 상속재산보다 작아지는 오류가 있었다(생전증여액만큼
// "사라짐"). 올바른 §1008 공식은
//   (순상속재산 + 생전증여 총액 − 인정 기여분 합계) × 법정상속분 − 본인 특별수익(증여+유증) + 본인 기여분
// 이며, 유증은 "2. 현재 상속재산"에 이미 포함돼 있어 간주상속재산에는 다시 더하지 않고 본인
// 몫에서만 뺀다. 이번 수정으로 간주상속재산(imputedEstate = net + giftTotal − 인정기여분합계)을
// 먼저 구해 법정상속분으로 나눈 뒤, 기여자에게는 인정 기여분을 더하는 방식으로 바꾼다.

// 1) 본문 안내 문구(필드 힌트)
apply(
`<div class="pen-field-hint" style="margin-bottom:0.6rem;">위 1차 배분액(기여분 반영분, 기여 기록이 없으면 법정상속분 그대로)에서 각자가 3번에서 입력한 증여·유증(특별수익)을 공제합니다. 기여에 대한 보상으로 인정된 부분(3번에서 "예"/"판단 필요"로 표시하고 보상액을 주장한 부분)은 특별수익에서도 같은 비율로 제외됩니다(민법 제1008조 단서). 특별수익이 1차 배분액보다 많으면(초과특별수익자) 그 사람의 구체적 상속분은 0으로 표시되며, 초과분을 다른 상속인에게 재분배하는 방법(초과특별수익자 조정)은 이 계산기가 반영하지 않으므로 실제 사건에서는 전문가와 상담하세요.</div>`,
`<div class="pen-field-hint" style="margin-bottom:0.6rem;">순상속재산에 생전증여 총액을 더하고 인정 기여분 합계를 뺀 "간주상속재산"을 법정상속분으로 나눈 뒤(유증은 "2. 현재 상속재산"에 이미 포함돼 있어 간주상속재산에는 다시 더하지 않습니다), 기여자에게는 인정 기여분을 더하고 각자가 3번에서 입력한 증여·유증(특별수익)을 공제합니다. 기여에 대한 보상으로 인정된 부분(3번에서 "예"/"판단 필요"로 표시하고 보상액을 주장한 부분)은 특별수익에서도 같은 비율로 제외됩니다(민법 제1008조 단서). 특별수익이 1차 배분액보다 많으면(초과특별수익자) 그 사람의 구체적 상속분은 0으로 표시되며, 초과분을 다른 상속인에게 재분배하는 방법(초과특별수익자 조정)은 이 계산기가 반영하지 않으므로 실제 사건에서는 전문가와 상담하세요.</div>`,
"HTML field-hint text"
);

// 2) 정적 테이블 헤더(초기 마크업)
apply(
`<div style="overflow-x:auto;"><table class="pen-compare-table" id="cc2-specialBenefitTable"><tr><th>상속인</th><th>기여분 반영 1차 배분액</th><th>받은 특별수익(증여+유증, 보상 인정분 제외)</th><th>특별수익 반영 구체적 상속분(참고)</th></tr></table></div>`,
`<div style="overflow-x:auto;"><table class="pen-compare-table" id="cc2-specialBenefitTable"><tr><th>상속인</th><th>간주상속재산 기준 1차 배분액</th><th>받은 특별수익(증여+유증, 보상 인정분 제외)</th><th>특별수익 반영 구체적 상속분(참고)</th></tr></table></div>`,
"HTML static table header"
);

// 3) JS 계산 로직 + 동적 테이블 헤더
apply(
`  // ── 특별수익(증여·유증) 반영 구체적 상속분 — 민법 §1008 ──
  // 위에서 계산한 기여분 반영 1차 배분액(기여 기록이 없으면 법정상속분 그대로)에서, 각자가
  // 받은 특별수익(생전증여+유증)을 공제한다. 기여에 대한 보상으로 인정된 부분(cc2GiftAppliedExclude)은
  // §1008 단서에 따라 특별수익에서도 제외한다. 특별수익이 1차 배분액을 초과하면(초과특별수익자)
  // §1008 본문에 따라 구체적 상속분은 0으로 하고, 초과분의 재분배(초과특별수익자 조정)는 반영하지 않는다.
  var specialBenefitEl = document.getElementById('cc2-specialBenefitTable');
  if (specialBenefitEl) {
    var sbRows = hs.map(function(h) {
      var firstAllocation = personNames.length ? (adjEstateCombined * h.share + (combinedAppliedByName[h.name] || 0)) : (net * h.share);
      var benefit = cc2Gifts.filter(function(g) { return g.person === h.name; })
        .reduce(function(sum, g) { return sum + Math.max(0, g.amount - cc2GiftAppliedExclude(g)); }, 0);
      var finalShare = Math.max(0, firstAllocation - benefit);
      var excess = benefit > firstAllocation;
      return '<tr><td>' + h.name + '</td><td>' + cc2Won(firstAllocation) + '</td><td>' + cc2Won(benefit) + '</td><td>' + cc2Won(finalShare) + (excess ? ' <span style="color:#c0392b; font-weight:700;">(초과수익)</span>' : '') + '</td></tr>';
    }).join('');
    specialBenefitEl.innerHTML = '<tr><th>상속인</th><th>기여분 반영 1차 배분액</th><th>받은 특별수익(증여+유증, 보상 인정분 제외)</th><th>특별수익 반영 구체적 상속분(참고)</th></tr>' + sbRows;
  }`,
`  // ── 특별수익(증여·유증) 반영 구체적 상속분 — 민법 §1008 ──
  // 간주상속재산(= 순상속재산 + 생전증여 총액 − 인정 기여분 합계)을 법정상속분으로 나눈 뒤,
  // 기여자에게는 인정 기여분을 더하고, 각자가 받은 특별수익(생전증여+유증)을 공제한다. 유증은
  // "2. 현재 상속재산"에 이미 포함돼 있어 간주상속재산에는 다시 더하지 않고 본인 몫에서만 뺀다.
  // 기여에 대한 보상으로 인정된 부분(cc2GiftAppliedExclude)은 §1008 단서에 따라 특별수익에서도
  // 제외한다. 특별수익이 1차 배분액을 초과하면(초과특별수익자) §1008 본문에 따라 구체적 상속분은
  // 0으로 하고, 초과분의 재분배(초과특별수익자 조정)는 반영하지 않는다.
  // (2026-11-07 수정: 이전 버전은 생전증여를 간주상속재산에 합산하지 않아 상속인들의 구체적
  // 상속분 합계가 순상속재산보다 작아지는 오류가 있었음 — 외부 검토로 발견, imputedEstate로 수정)
  var specialBenefitEl = document.getElementById('cc2-specialBenefitTable');
  if (specialBenefitEl) {
    var contribAppliedTotal = personNames.length ? combinedApplied : 0;
    var imputedEstate = Math.max(0, net + giftTotal - contribAppliedTotal);
    var sbRows = hs.map(function(h) {
      var firstAllocation = imputedEstate * h.share + (personNames.length ? (combinedAppliedByName[h.name] || 0) : 0);
      var benefit = cc2Gifts.filter(function(g) { return g.person === h.name; })
        .reduce(function(sum, g) { return sum + Math.max(0, g.amount - cc2GiftAppliedExclude(g)); }, 0);
      var finalShare = Math.max(0, firstAllocation - benefit);
      var excess = benefit > firstAllocation;
      return '<tr><td>' + h.name + '</td><td>' + cc2Won(firstAllocation) + '</td><td>' + cc2Won(benefit) + '</td><td>' + cc2Won(finalShare) + (excess ? ' <span style="color:#c0392b; font-weight:700;">(초과수익)</span>' : '') + '</td></tr>';
    }).join('');
    specialBenefitEl.innerHTML = '<tr><th>상속인</th><th>간주상속재산 기준 1차 배분액</th><th>받은 특별수익(증여+유증, 보상 인정분 제외)</th><th>특별수익 반영 구체적 상속분(참고)</th></tr>' + sbRows;
  }`,
"JS calculation block"
);

fs.writeFileSync(path, s, 'utf8');
console.log('special benefit fix applied OK, new length', s.length);
