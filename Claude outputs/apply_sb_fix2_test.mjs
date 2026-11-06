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

// 2026-11-06판 소스코드 존재 검증을 giftTotalForImputed(2026-11-07 수정판) 기준으로 갱신
apply(
`t('소스 코드에 간주상속재산(imputedEstate = net + giftTotal - 기여분) 계산이 존재',()=>{
  assert(s.includes('var imputedEstate = Math.max(0, net + giftTotal - contribAppliedTotal);'));
  assert(s.includes('var firstAllocation = imputedEstate * h.share + (personNames.length ? (combinedAppliedByName[h.name] || 0) : 0);'));
});`,
`t('소스 코드에 간주상속재산(imputedEstate = net + giftTotalForImputed - 기여분) 계산이 존재',()=>{
  assert(s.includes('var imputedEstate = Math.max(0, net + giftTotalForImputed - contribAppliedTotal);'));
  assert(s.includes('var firstAllocation = imputedEstate * h.share + (personNames.length ? (combinedAppliedByName[h.name] || 0) : 0);'));
});

// --- 2026-11-07(2차) 버그 수정 회귀: 보상적 증여로 전액 인정된 생전증여는 간주상속재산에
// 더하면 안 됨(외부 검토[HEPS Intelligence]로 발견). 상속 10억·자녀2명·자녀1 생전증여 4억 전액
// 보상 인정 시, 수정 전에는 7억/7억(합계 14억, 4억 과다 계상)이었음. ---
t('간주상속재산 2차 수정: 생전증여 전액이 보상적 증여로 인정되면 간주상속재산에 더하지 않음(합계 10억 유지)',()=>{
  const net = 1_000_000_000, contribAppliedTotal = 0;
  const g = { qual: 'yes', exclude: 400_000_000, amount: 400_000_000, evidence: 3, type: 'gift', person: '자녀1' };
  const applied = g.evidence === 3 ? Math.min(g.exclude, g.amount) * 1.0 : 0; // cc2GiftAppliedExclude 재현
  const giftTotalForImputed = Math.max(0, g.amount - applied); // = 0
  const imputedEstate = Math.max(0, net + giftTotalForImputed - contribAppliedTotal); // = 10억
  const share = 0.5;
  const child1FirstAllocation = imputedEstate * share;
  const child2FirstAllocation = imputedEstate * share;
  const benefit1 = Math.max(0, g.amount - applied); // = 0 (전액 보상 인정)
  const child1Final = Math.max(0, child1FirstAllocation - benefit1);
  const child2Final = Math.max(0, child2FirstAllocation - 0);
  assert.equal(child1Final, 500_000_000);
  assert.equal(child2Final, 500_000_000);
  assert.equal(child1Final + child2Final, net);
});
t('소스 코드에 giftTotalForImputed(보상 인정분 제외한 생전증여만 간주상속재산에 가산) 계산이 존재',()=>{
  assert(s.includes("var giftTotalForImputed = cc2Gifts.filter(function(g) { return g.type !== 'bequest'; })"));
});

// --- 2026-11-07(2차) 개선: 유증 수령자의 총귀속액(= 구체적 상속분 + 유증) 표시 ---
t('간주상속재산 2차 수정: 유증 수령자도 총귀속액(구체적 상속분+유증) 합계가 순상속재산과 일치',()=>{
  const net = 1_000_000_000, giftTotalForImputed = 0, contribAppliedTotal = 0;
  const imputedEstate = Math.max(0, net + giftTotalForImputed - contribAppliedTotal); // 10억(유증은 가산 안 함)
  const share = 0.5;
  const child1FirstAllocation = imputedEstate * share; // 5억
  const child2FirstAllocation = imputedEstate * share; // 5억
  const bequest1 = 200_000_000;
  const benefit1 = bequest1; // qual='no' 기본값이면 cc2GiftAppliedExclude=0이라 benefit = amount 그대로
  const child1Final = Math.max(0, child1FirstAllocation - benefit1); // 3억
  const child2Final = Math.max(0, child2FirstAllocation - 0); // 5억
  const child1Total = child1Final + bequest1; // 5억
  const child2Total = child2Final + 0; // 5억
  assert.equal(child1Final, 300_000_000);
  assert.equal(child1Total, 500_000_000);
  assert.equal(child1Total + child2Total, net);
});
t('소스 코드에 유증 수령액·총귀속액 열 계산이 존재',()=>{
  assert(s.includes("var bequestReceived = cc2Gifts.filter(function(g) { return g.person === h.name && g.type === 'bequest'; })"));
  assert(s.includes('var totalReceived = finalShare + bequestReceived;'));
  assert(s.includes('id="cc2-specialBenefitTable"'));
});

// --- 대법원 2024다208261 적용시점 안내 보완 검증(외부 검토 — 판결문 원문 대조로 발견) ---
t('2024.4.25 이전 개시 상속도 소송 계속 중이었다면 적용될 수 있다는 안내가 존재(대법원 2024다208261 소급효)',()=>{
  assert(s.includes('헌법불합치결정 당시 법원에 재판이 계속 중이었다면'));
});`,
"sb fix2 + 판결 적용범위 tests"
);

fs.writeFileSync(path, s, 'utf8');
console.log('sb fix2 test applied OK, new length', s.length);
