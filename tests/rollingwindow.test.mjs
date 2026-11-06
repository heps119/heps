import { 롤링윈도우함수 } from './extract.mjs';
const f = 롤링윈도우함수();
const results = [];
const check = (ok, msg) => { results.push(ok); console.log(ok ? '✅' : '❌', msg); };
const 억 = 100_000_000;

check(f.rwBracketLimit('spouse', '2008-01-01') === 6 * 억 && f.rwBracketLimit('spouse', '2007-12-31') === 3 * 억, '배우자공제 한도 — 2008-01-01 6억 / 2007-12-31 3억');
check(f.rwBracketLimit('spouse', '2003-01-01') === 3 * 억 && f.rwBracketLimit('spouse', '2002-12-31') === 5 * 억, '배우자공제 한도 — 2003-01-01 3억 / 2002-12-31 5억');
check(f.rwBracketLimit('desc_adult', '2014-01-01') === 5000_0000 && f.rwBracketLimit('desc_adult', '2013-12-31') === 3000_0000, '성년 직계비속 — 2014-01-01 5천만 / 2013-12-31 3천만');
check(f.rwBracketLimit('desc_minor', '2014-01-01') === 2000_0000 && f.rwBracketLimit('desc_minor', '2013-12-31') === 1500_0000, '미성년 직계비속 — 2014-01-01 2천만 / 2013-12-31 1천5백만');
check(f.rwBracketLimit('other', '2016-01-01') === 1000_0000 && f.rwBracketLimit('other', '2015-12-31') === 500_0000, '기타친족 — 2016-01-01 1천만 / 2015-12-31 5백만');

check(f.rwSurchargeRate('skip_adult', '2026-01-01', 30 * 억) === 0.3, '세대생략 할증 — 성년 손자녀 30%');
check(f.rwSurchargeRate('skip_minor', '2026-01-01', 20 * 억 + 1) === 0.4 && f.rwSurchargeRate('skip_minor', '2026-01-01', 20 * 억) === 0.3, '세대생략 할증 — 미성년 20억 초과만 40%');
check(f.rwSurchargeRate('skip_minor', '2015-12-31', 30 * 억) === 0.3, '세대생략 할증 — 2015-12-31은 40% 아닌 30%');
check(f.rwSurchargeRate('desc_adult', '2026-01-01', 30 * 억) === 0, '세대생략 아닌 증여는 할증 없음');

check(f.rwReportRate('2016-12-31') === 0.10 && f.rwReportRate('2017-01-01') === 0.07 && f.rwReportRate('2018-12-31') === 0.05 && f.rwReportRate('2019-01-01') === 0.03, '신고세액공제율 연혁');

check(f.rwTaxCalc(1 * 억) === 10_000_000 && f.rwTaxCalc(5 * 억) === 90_000_000 && f.rwTaxCalc(10 * 억) === 240_000_000, '증여세 세율표 — 1억 1천만 / 5억 9천만 / 10억 2억4천만');
check(f.rwAddYears('2020-02-29', -10) === '2010-02-28', '10년 전 계산 — 윤일은 말일로 맞춤');

const 실패 = results.filter((x) => !x).length;
console.log(`\n총 ${results.length}건 중 실패 ${실패}건`);
if (실패) process.exit(1);
