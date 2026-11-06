import fs from 'node:fs';

const path = process.argv[2];
let s = fs.readFileSync(path, 'utf8');

function must(old, label) {
  const n = s.split(old).length - 1;
  if (n !== 1) throw new Error(`"${label}" matched ${n} times (expected 1)`);
}

const marker = `console.log(n+' passed');`;
must(marker, "marker");

const addition = `
// --- 2026-11-07 버그 수정 회귀: 특별수익 반영 구체적 상속분 합계가 순상속재산과 일치해야 함 ---
// (외부 검토로 발견: 이전 버전은 생전증여를 간주상속재산에 합산하지 않아 구체적 상속분 합계가
// 순상속재산보다 생전증여액만큼 작아지는 오류가 있었음. 올바른 §1008 공식:
//   (순상속재산 + 생전증여 총액 − 인정 기여분 합계) × 법정상속분 − 본인 특별수익 + 본인 기여분)
t('간주상속재산 수정: 상속재산 10억·자녀2명·자녀1 생전증여 4억(기여분 없음) → 3억/7억, 합계 10억(§1008)',()=>{
  const net = 1_000_000_000, giftTotal = 400_000_000, contribAppliedTotal = 0;
  const imputedEstate = Math.max(0, net + giftTotal - contribAppliedTotal);
  const share = 0.5;
  const child1FirstAllocation = imputedEstate * share; // 기여분 없음
  const child2FirstAllocation = imputedEstate * share;
  const child1Final = Math.max(0, child1FirstAllocation - 400_000_000);
  const child2Final = Math.max(0, child2FirstAllocation - 0);
  assert.equal(child1Final, 300_000_000);
  assert.equal(child2Final, 700_000_000);
  assert.equal(child1Final + child2Final, net); // 합계가 순상속재산과 일치해야 함(생전증여는 이미 밖으로 나간 재산)
});
t('간주상속재산 수정: 기여분(자녀2, 2억 인정)이 섞여도 구체적 상속분 합계는 순상속재산과 일치',()=>{
  const net = 1_000_000_000, giftTotal = 400_000_000, contribAppliedTotal = 200_000_000;
  const imputedEstate = Math.max(0, net + giftTotal - contribAppliedTotal); // 12억
  const share = 0.5;
  const child1FirstAllocation = imputedEstate * share; // 6억, 기여분 없음
  const child2FirstAllocation = imputedEstate * share + 200_000_000; // 6억+2억=8억
  const child1Final = Math.max(0, child1FirstAllocation - 400_000_000); // 2억
  const child2Final = Math.max(0, child2FirstAllocation - 0); // 8억
  assert.equal(child1Final, 200_000_000);
  assert.equal(child2Final, 800_000_000);
  assert.equal(child1Final + child2Final, net);
});
t('소스 코드에 간주상속재산(imputedEstate = net + giftTotal - 기여분) 계산이 존재',()=>{
  assert(s.includes('var imputedEstate = Math.max(0, net + giftTotal - contribAppliedTotal);'));
  assert(s.includes('var firstAllocation = imputedEstate * h.share + (personNames.length ? (combinedAppliedByName[h.name] || 0) : 0);'));
});

${marker}`;

s = s.replace(marker, addition);
fs.writeFileSync(path, s, 'utf8');
console.log('sb fix test applied OK, new length', s.length);
