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

// ===== FIX A + B: 특별수익 반영 구체적 상속분 — 외부 검토(HEPS Intelligence)로 발견된 2건 수정 =====
// A) 보상적 증여로 인정된 부분이 간주상속재산(공통 풀)을 부풀리는 오류: 생전증여 중 "보상적
//    증여"로 인정된 부분은 그 사람의 몫에서 빼지 않는 대신,애초에 간주상속재산(모두의 공통 풀)에도
//    넣지 않아야 한다(그 돈은 이미 기여에 대한 정당한 대가이지 상속분의 선지급이 아니므로). 기존
//    코드는 giftTotal(인정비율 무관, 생전증여 전액)을 그대로 더해, 보상 인정분만큼 합계가 순상속재산을
//    초과하는 오류가 있었다(예: 상속 10억, 생전증여 4억 전액 보상 인정 → 7억/7억=14억으로 집계).
// B) 유증은 간주상속재산에 다시 더하지 않고 본인 몫에서만 빼는 설계라, "구체적 상속분(참고)" 열만
//    보면 유증 수령자의 실제 총취득액이 누락돼 보인다(유증 수령자의 총귀속액 = 구체적 상속분 + 유증).
//    "유증으로 받은 금액"·"총귀속액(참고)" 열을 추가해 혼동을 막는다.
apply(
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
`  // ── 특별수익(증여·유증) 반영 구체적 상속분 — 민법 §1008 ──
  // 간주상속재산(= 순상속재산 + "특별수익으로 남는" 생전증여 − 인정 기여분 합계)을 법정상속분으로
  // 나눈 뒤, 기여자에게는 인정 기여분을 더하고, 각자가 받은 특별수익(생전증여+유증)을 공제한다.
  // 기여에 대한 보상으로 인정된 부분(cc2GiftAppliedExclude)은 §1008 단서에 따라 "특별수익에서"
  // 제외되므로, 간주상속재산에 더할 때도 그 인정분만큼은 빼고 더한다(그 돈은 기여에 대한 정당한
  // 대가이지 상속분의 선지급이 아니므로 공통 풀을 부풀리면 안 됨 — 2026-11-07 외부 검토로 발견한
  // 버그: 이전 버전은 생전증여 전액을 그대로 간주상속재산에 더해, 보상 인정분만큼 상속인들의
  // 구체적 상속분 합계가 순상속재산을 초과하는 오류가 있었음). 유증은 "2. 현재 상속재산"에 이미
  // 포함돼 있어 간주상속재산에는 더하지 않고 본인 몫에서만 뺀다. 특별수익이 1차 배분액을
  // 초과하면(초과특별수익자) §1008 본문에 따라 구체적 상속분은 0으로 하고, 초과분의
  // 재분배(초과특별수익자 조정)는 반영하지 않는다.
  var specialBenefitEl = document.getElementById('cc2-specialBenefitTable');
  if (specialBenefitEl) {
    var contribAppliedTotal = personNames.length ? combinedApplied : 0;
    var giftTotalForImputed = cc2Gifts.filter(function(g) { return g.type !== 'bequest'; })
      .reduce(function(sum, g) { return sum + Math.max(0, g.amount - cc2GiftAppliedExclude(g)); }, 0);
    var imputedEstate = Math.max(0, net + giftTotalForImputed - contribAppliedTotal);
    var sbRows = hs.map(function(h) {
      var firstAllocation = imputedEstate * h.share + (personNames.length ? (combinedAppliedByName[h.name] || 0) : 0);
      var benefit = cc2Gifts.filter(function(g) { return g.person === h.name; })
        .reduce(function(sum, g) { return sum + Math.max(0, g.amount - cc2GiftAppliedExclude(g)); }, 0);
      var finalShare = Math.max(0, firstAllocation - benefit);
      var excess = benefit > firstAllocation;
      // 유증은 간주상속재산에 다시 더하지 않고 본인 몫에서만 빼므로, "구체적 상속분" 열만 보면
      // 유증 수령자의 실제 총취득액이 누락돼 보인다 — 총귀속액(= 구체적 상속분 + 유증)을 별도 표시.
      var bequestReceived = cc2Gifts.filter(function(g) { return g.person === h.name && g.type === 'bequest'; })
        .reduce(function(sum, g) { return sum + g.amount; }, 0);
      var totalReceived = finalShare + bequestReceived;
      return '<tr><td>' + h.name + '</td><td>' + cc2Won(firstAllocation) + '</td><td>' + cc2Won(benefit) + '</td><td>' + cc2Won(finalShare) + (excess ? ' <span style="color:#c0392b; font-weight:700;">(초과수익)</span>' : '') + '</td><td>' + cc2Won(bequestReceived) + '</td><td>' + cc2Won(totalReceived) + '</td></tr>';
    }).join('');
    specialBenefitEl.innerHTML = '<tr><th>상속인</th><th>간주상속재산 기준 1차 배분액</th><th>받은 특별수익(증여+유증, 보상 인정분 제외)</th><th>특별수익 반영 구체적 상속분(참고)</th><th>유증으로 받은 금액</th><th>총귀속액(구체적 상속분+유증, 참고)</th></tr>' + sbRows;
  }`,
"specialBenefit JS fix A+B"
);

// 정적 테이블 헤더에도 새 열 2개 추가
apply(
`<div style="overflow-x:auto;"><table class="pen-compare-table" id="cc2-specialBenefitTable"><tr><th>상속인</th><th>간주상속재산 기준 1차 배분액</th><th>받은 특별수익(증여+유증, 보상 인정분 제외)</th><th>특별수익 반영 구체적 상속분(참고)</th></tr></table></div>`,
`<div style="overflow-x:auto;"><table class="pen-compare-table" id="cc2-specialBenefitTable"><tr><th>상속인</th><th>간주상속재산 기준 1차 배분액</th><th>받은 특별수익(증여+유증, 보상 인정분 제외)</th><th>특별수익 반영 구체적 상속분(참고)</th><th>유증으로 받은 금액</th><th>총귀속액(구체적 상속분+유증, 참고)</th></tr></table></div>`,
"specialBenefit static header +2 cols"
);

// 안내 힌트에 "총귀속액" 설명 추가
apply(
`<div class="pen-field-hint" style="margin-bottom:0.6rem;">순상속재산에 생전증여 총액을 더하고 인정 기여분 합계를 뺀 "간주상속재산"을 법정상속분으로 나눈 뒤(유증은 "2. 현재 상속재산"에 이미 포함돼 있어 간주상속재산에는 다시 더하지 않습니다), 기여자에게는 인정 기여분을 더하고 각자가 3번에서 입력한 증여·유증(특별수익)을 공제합니다. 기여에 대한 보상으로 인정된 부분(3번에서 "예"/"판단 필요"로 표시하고 보상액을 주장한 부분)은 특별수익에서도 같은 비율로 제외됩니다(민법 제1008조 단서). 특별수익이 1차 배분액보다 많으면(초과특별수익자) 그 사람의 구체적 상속분은 0으로 표시되며, 초과분을 다른 상속인에게 재분배하는 방법(초과특별수익자 조정)은 이 계산기가 반영하지 않으므로 실제 사건에서는 전문가와 상담하세요.</div>`,
`<div class="pen-field-hint" style="margin-bottom:0.6rem;">순상속재산에 생전증여 중 특별수익으로 남는 부분(기여에 대한 보상으로 인정된 부분은 제외)을 더하고 인정 기여분 합계를 뺀 "간주상속재산"을 법정상속분으로 나눈 뒤(유증은 "2. 현재 상속재산"에 이미 포함돼 있어 간주상속재산에는 다시 더하지 않습니다), 기여자에게는 인정 기여분을 더하고 각자가 3번에서 입력한 증여·유증(특별수익)을 공제합니다. 기여에 대한 보상으로 인정된 부분(3번에서 "예"/"판단 필요"로 표시하고 보상액을 주장한 부분)은 특별수익에서도 같은 비율로 제외됩니다(민법 제1008조 단서). 특별수익이 1차 배분액보다 많으면(초과특별수익자) 그 사람의 구체적 상속분은 0으로 표시되며, 초과분을 다른 상속인에게 재분배하는 방법(초과특별수익자 조정)은 이 계산기가 반영하지 않으므로 실제 사건에서는 전문가와 상담하세요. 유증을 받은 상속인은 "구체적 상속분"만으로는 실제 총취득액이 드러나지 않으므로, 맨 오른쪽 "총귀속액" 열(구체적 상속분+유증)을 함께 보세요.</div>`,
"specialBenefit hint +총귀속액 설명"
);

// ===== FIX C: 2024.4.25 적용시점 안내 — 대법원 2024다208261 판결의 소급효 범위 보완 =====
// 외부 검토(HEPS Intelligence)가 판결문을 직접 대조해 지적: 부칙 §2는 "2024.4.25 이후 개시 상속"에만
// 신법을 적용한다고 정하지만, 같은 판결은 그 "이전에 개시된 상속"이라도 2024.4.25 헌법불합치결정
// 당시 이미 법원에 계속 중이던 사건에는 소급효가 미쳐 신법이 적용된다고 판시했다(사안 자체가
// 2018년 개시 상속). 상속개시일 하나만으로 적용 여부를 단정하지 않도록 안내문을 보완한다.
apply(
`이 조항은 2024년 4월 25일 이후 개시된 상속부터 적용됩니다.', this)" title="음성으로 듣기">🔊</button>`,
`이 조항은 2024년 4월 25일 이후 개시된 상속에 적용되며, 그 전에 개시된 상속이라도 그 날짜에 이미 법원에 재판이 계속 중이었다면 대법원 판례에 따라 적용될 수 있습니다.', this)" title="음성으로 듣기">🔊</button>`,
"2024.4.25 disclaimer - TTS string"
);
apply(
`또한 개정 민법 제1008조 단서는 <strong>2024년 4월 25일 이후 개시된 상속</strong>에 한해 적용되니, 상속개시일을 먼저 확인해 주세요. <strong>대법원 2026. 5. 29. 선고 2024다208261 판결</strong>은 이 단서의 보상적 증여·유증이 기여에 상응하는 범위에서 유류분 산정 기초재산에서도 제외된다는 점을 확인했습니다.`,
`또한 개정 민법 제1008조 단서는 원칙적으로 <strong>2024년 4월 25일 이후 개시된 상속</strong>에 적용됩니다(민법 부칙 2026.3.17. 제2조). 다만 <strong>대법원 2026. 5. 29. 선고 2024다208261 판결</strong>은 그 이전에 개시된 상속이라도 2024년 4월 25일 헌법불합치결정 당시 법원에 재판이 계속 중이었다면(위헌제청신청을 따로 하지 않았어도) 소급효가 미쳐 신법 조항이 적용된다고 보았으므로, 상속개시일만으로 적용 여부를 단정하지 말고 관련 소송 계속 여부도 확인해 주세요.`,
"2024.4.25 disclaimer - warning box"
);
apply(
`<strong>1. 기본정보</strong> — 상속개시일과 배우자·자녀·직계존속 수를 입력합니다. 개정 민법 제1008조 단서는 <strong>2024년 4월 25일 이후 개시된 상속</strong>에만 적용되니 상속개시일을 꼭 확인하세요.`,
`<strong>1. 기본정보</strong> — 상속개시일과 배우자·자녀·직계존속 수를 입력합니다. 개정 민법 제1008조 단서는 원칙적으로 <strong>2024년 4월 25일 이후 개시된 상속</strong>에 적용되지만, 그 전에 개시된 상속이라도 2024년 4월 25일 당시 법원에 재판이 계속 중이었다면 대법원 판례(2024다208261)에 따라 적용될 수 있으니 상속개시일만으로 단정하지 마세요.`,
"2024.4.25 disclaimer - help modal 1.기본정보"
);
apply(
`msg += '· 대법원 2026. 5. 29. 선고 2024다208261 판결은 보상적 증여·유증을 기여에 상응하는 범위에서 유류분 산정 기초재산에서도 제외하는 구조를 확인했습니다. 이 조항은 2024년 4월 25일 이후 개시된 상속에 한해 적용됩니다(민법 부칙 2026.3.17. 제2조).<br>';`,
`msg += '· 대법원 2026. 5. 29. 선고 2024다208261 판결은 보상적 증여·유증을 기여에 상응하는 범위에서 유류분 산정 기초재산에서도 제외하는 구조를 확인했습니다. 이 조항은 원칙적으로 2024년 4월 25일 이후 개시된 상속에 적용되지만(민법 부칙 2026.3.17. 제2조), 같은 판결은 그 전에 개시된 상속이라도 2024년 4월 25일 헌법불합치결정 당시 법원에 재판이 계속 중이었다면 소급효가 미친다고 보았으니, 상속개시일이 그 이전이면 관련 소송 계속 여부도 확인하세요.<br>';`,
"2024.4.25 disclaimer - auto report msg"
);

fs.writeFileSync(path, s, 'utf8');
console.log('review follow-up fixes applied OK, new length', s.length);
