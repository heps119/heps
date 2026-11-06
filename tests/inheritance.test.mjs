import { 상속세계산기 } from './extract.mjs';
const results = [];
const check = (ok, msg) => { results.push(ok); console.log(ok ? '✅' : '❌', msg); };
const 억 = 100_000; // 입력 단위가 천원이므로 1억원 = 100,000
// 화면 표시 문자열("2억 3,850만원", "59,924,623원")을 원 단위 숫자로 바꾼다.
const 원 = (t) => {
  const 숫자 = (x) => Number(String(x ?? '0').replace(/,/g, ''));
  const s = String(t);
  const m = s.match(/(?:([\d,]+)억)?\s*(?:([\d,]+)만)?\s*(?:([\d,]+)\s*원)?/);
  return 숫자(m?.[1]) * 1e8 + 숫자(m?.[2]) * 1e4 + 숫자(m?.[3]);
};

// 자녀 2명, 상속재산 12억 + 사전증여 3억(당시 증여재산공제 5천만), 이미 낸 증여세 4천만 → 과세가액 15억
const 기본 = { c_asset: String(12 * 억), c_gift: String(3 * 억), c_gift_deduct: '50000', c_children: '2', c_paid_tax: '40000' };
const r = 상속세계산기(기본);
check(!/해당 없음/.test(r['r-paid'] ?? ''), '증여세액공제 — 과세가액 15억이면 공제 적용');
// 한도는 증여재산가액(3억)이 아니라 공제 후 과세표준(2.5억) 기준이어야 한다
const 큰납부 = 상속세계산기({ ...기본, c_paid_tax: '999999999' });
const 한도원 = 원(String(큰납부['r-paid']).match(/△ ([\d,]+원)/)?.[1]);
const 산출 = 원(큰납부['r-calculated']);
const 과표 = 원(큰납부['r-base']);
check(Number.isFinite(한도원) && Math.abs(한도원 - Math.round(산출 * 250_000_000 / 과표)) <= 1000,
  `증여세액공제 한도 = 산출세액 × 증여 과세표준(2.5억)/상속세 과세표준 (표시 ${한도원 && 한도원.toLocaleString()}, 산출 ${산출.toLocaleString()}, 과표 ${과표.toLocaleString()})`);

// §28① 단서: 과세가액 5억 이하 → 공제 배제
const 이하 = 상속세계산기({ c_asset: String(4 * 억), c_gift: String(5000), c_children: '1', c_paid_tax: '1000' });
check(/해당 없음/.test(이하['r-paid'] ?? '') && /5억원 이하/.test(이하['r-paid'] ?? ''), '증여세액공제 — 상속세 과세가액 5억 이하면 배제(§28① 단서)');

const 실패 = results.filter((x) => !x).length;
console.log(`\n총 ${results.length}건 중 실패 ${실패}건`);
if (실패) process.exit(1);
