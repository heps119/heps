// 상속부동산 처분 양도세 시뮬레이터(iptCalc): 소득세법 §55①(누진세율), §95②·④(장특), §104①②(단기세율) 회귀 테스트
import fs from 'node:fs'; import assert from 'node:assert'; import vm from 'node:vm';
import { 함수추출 } from './extract.mjs';
const s=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
let n=0; const t=(m,f)=>{f();n++;console.log('ok',m)};
const 코드=['iptProgressiveTax','iptHeavyProgressiveTax','iptLtcTable1','iptShortTermRate','iptYearsBetween','iptDaysBetween','iptCalc'].map(x=>함수추출(s,x)).join('\n')
 +'\nvar iptWon=function(n){return Math.round(n).toLocaleString("ko-KR")+"원"};\nthis.run=iptCalc;this.prog=iptProgressiveTax;this.heavyProg=iptHeavyProgressiveTax;this.ltc=iptLtcTable1;this.st=iptShortTermRate;';
function 실행(v){
  const out={};
  const el=(id)=>({value:v[id]??'',set innerHTML(x){out.html=x},get innerHTML(){return out.html}});
  const c={document:{getElementById:el},penRawNumber:(id)=>String(v[id]??'').replace(/[^0-9]/g,''),Date,Math,parseFloat,parseInt,String};
  vm.createContext(c); vm.runInContext(코드,c); c.run(); return {html:out.html,c};
}
const 기본={'ipt-inheritValue':'700000000','ipt-saleValue':'1000000000','ipt-expenses':'20000000','ipt-basicDeduction':'2500000','ipt-ltcRate':'',
 'ipt-inheritDate':'2020-01-01','ipt-saleDate':'2026-01-01','ipt-sameHousehold':'no','ipt-existingHomes':'0','ipt-otherHomeAtSale':'no','ipt-sellInheritedFirst':'yes','ipt-assetType':'land','ipt-decedentYears':'10','ipt-heirYears':'0.5'};
const 원=(h,라벨)=>{const m=h.match(new RegExp(라벨+'</td><td>([\\d,]+)원'));return m?Number(m[1].replace(/,/g,'')):null;};
const {c}=실행(기본);
t('누진세율표 §55① (검증값)',()=>{assert.equal(c.prog(14e6),840000);assert.equal(c.prog(50e6),6240000);assert.equal(c.prog(88e6),15360000);assert.equal(c.prog(150e6),37060000);assert.equal(c.prog(300e6),94060000);assert.equal(c.prog(500e6),174060000);assert.equal(c.prog(1e9),384060000);});
t('장특 표1: 3년 6%, 4년 8%, 10년 20%, 15년 30%, 3년 미만 0',()=>{[[2.9,0],[3,6],[4,8],[10,20],[15,30],[20,30]].forEach(([y,r])=>assert.equal(c.ltc(y),r));});
t('단기세율: 1년 미만 주택 70/기타 50, 1~2년 주택 60/기타 40, 2년 이상 0',()=>{assert.equal(c.st(0.5,true),0.7);assert.equal(c.st(0.5,false),0.5);assert.equal(c.st(1.5,true),0.6);assert.equal(c.st(1.5,false),0.4);assert.equal(c.st(2,true),0);});
t('상속 후 6년: 장특 12% 자동(비움)',()=>{const r=실행(기본);assert.equal(원(r.html,'장기보유특별공제'),Math.round(280e6*0.12));});
t('상속 후 2년(<3년): 장특 0',()=>{const r=실행({...기본,'ipt-saleDate':'2022-01-01'});assert.equal(원(r.html,'장기보유특별공제'),0);});
t('피상속인 보유 10년이면 상속 후 6개월 양도도 단기세율 아님',()=>{const r=실행({...기본,'ipt-saleDate':'2020-07-01'});assert(!r.html.includes('단기양도세율 적용'));});
t('피상속인 0.5년 + 상속 후 0.5년 → 1년 미만, 토지 50%',()=>{const r=실행({...기본,'ipt-saleDate':'2020-07-01','ipt-decedentYears':'0.5','ipt-assetType':'land'});assert(r.html.includes('50%를 적용'));});
t('입력 장특이 법정표1보다 크면 경고',()=>{const r=실행({...기본,'ipt-ltcRate':'30'});assert(r.html.includes('법정 표1'));});
t('윤년 경계: 2021-03-01→2024-03-01(1095일)도 3년 이상 → 장특 6%',()=>{const r=실행({...기본,'ipt-inheritDate':'2021-03-01','ipt-saleDate':'2024-03-01'});assert.equal(원(r.html,'장기보유특별공제'),Math.round(280e6*0.06));});
t('하루 모자라면 3년 미만 → 장특 0',()=>{const r=실행({...기본,'ipt-inheritDate':'2021-03-01','ipt-saleDate':'2024-02-29'});assert.equal(원(r.html,'장기보유특별공제'),0);});

// --- 1세대1주택 비과세(소득세법 §89조제1항제3호, 시행령 §154조·§155조제2항·§160조) ---
t('별도세대·1주택 6년 보유·12억 이하 -> 비과세 전액',()=>{
  const r=실행({...기본,'ipt-assetType':'house','ipt-otherHomeAtSale':'no','ipt-existingHomes':'0','ipt-sameHousehold':'no'});
  assert(r.html.includes('1세대1주택 비과세 판정</td><td>비과세(전액)'));
  assert(r.html.includes('지방소득세(양도소득세의 10% 가정)</td><td>0원'));
  assert(r.html.includes('1세대1주택 비과세 요건'));
});
t('별도세대·보유 1년(2년 미만) -> 비과세 아님(일반과세 유지)',()=>{
  const r=실행({...기본,'ipt-assetType':'house','ipt-otherHomeAtSale':'no','ipt-existingHomes':'0','ipt-sameHousehold':'no','ipt-saleDate':'2021-01-01'});
  assert(r.html.includes('1세대1주택 비과세 판정</td><td>비과세 아님'));
});
t('양도일 현재 다른 주택 보유 중(상속주택을 먼저 양도) -> 비과세 아님',()=>{
  const r=실행({...기본,'ipt-assetType':'house','ipt-otherHomeAtSale':'yes','ipt-existingHomes':'1','ipt-sameHousehold':'no'});
  assert(r.html.includes('1세대1주택 비과세 판정</td><td>비과세 아님'));
});
t('동일세대 상속: 피상속인 보유기간 합산으로 2년 요건 충족(시행령 §154조제8항제3호)',()=>{
  const 공통={...기본,'ipt-assetType':'house','ipt-otherHomeAtSale':'no','ipt-existingHomes':'0','ipt-saleDate':'2021-01-01','ipt-decedentYears':'5'};
  const 동일세대=실행({...공통,'ipt-sameHousehold':'yes'});
  const 별도세대=실행({...공통,'ipt-sameHousehold':'no'});
  assert(동일세대.html.includes('1세대1주택 비과세 판정</td><td>비과세(전액)'));
  assert(별도세대.html.includes('1세대1주택 비과세 판정</td><td>비과세 아님'));
});
t('고가주택(12억원 초과): 초과분만 과세, 장특도 같은 비율로 안분(시행령 §160조)',()=>{
  const 공통={...기본,'ipt-inheritDate':'2015-01-01','ipt-saleDate':'2026-01-01','ipt-saleValue':'2000000000','ipt-otherHomeAtSale':'no','ipt-existingHomes':'0','ipt-sameHousehold':'no'};
  const 땅=실행({...공통,'ipt-assetType':'land'});
  const gain0=원(땅.html,'양도차익');
  const ltc0=원(땅.html,'장기보유특별공제');
  const 집=실행({...공통,'ipt-assetType':'house'});
  assert(집.html.includes('1세대1주택 비과세 판정</td><td>고가주택'));
  assert(집.html.includes('40.0%'));
  const expectedTaxable=Math.round(Math.max(0, gain0*0.4 - ltc0*0.4 - 2500000));
  const got=원(집.html,'과세표준\\(단순계산\\)');
  assert.equal(got, expectedTaxable);
});
t('주택이 아닌 자산(토지)은 비과세 판정 "해당 없음"',()=>{
  const r=실행(기본);
  assert(r.html.includes('1세대1주택 비과세 판정</td><td>해당 없음'));
});

// --- 다주택 중과(소득세법 §104조제7항, 시행령 §167조의3제1항제12호의2·제167조의10) ---
t('조정대상지역 2주택·보유2년 이상·유예종료 후(2026-07-01) -> 중과 +20%p, 장특 배제',()=>{
  const r=실행({...기본,'ipt-assetType':'house','ipt-otherHomeAtSale':'yes','ipt-otherHomeCount':'1','ipt-adjustedArea':'yes','ipt-saleDate':'2026-07-01'});
  assert(r.html.includes('다주택 중과 판정</td><td>중과 적용(총 2주택, +20%p'));
  assert.equal(원(r.html,'장기보유특별공제'),0);
  const gain=1000000000-700000000-20000000, bd=2500000, taxable=gain-bd;
  const expectedTax=Math.max(c.heavyProg(taxable,20), 0);
  assert.equal(원(r.html,'양도소득세\\(누진세율, 1~2년 미만 보유는 단기세율과 비교\\)'),Math.round(expectedTax));
});
t('조정대상지역 3주택 이상·동일 조건 -> 중과 +30%p',()=>{
  const r=실행({...기본,'ipt-assetType':'house','ipt-otherHomeAtSale':'yes','ipt-otherHomeCount':'2','ipt-adjustedArea':'yes','ipt-saleDate':'2026-07-01'});
  assert(r.html.includes('다주택 중과 판정</td><td>중과 적용(총 3주택, +30%p'));
  const gain=1000000000-700000000-20000000, bd=2500000, taxable=gain-bd;
  const expectedTax=Math.max(c.heavyProg(taxable,30), 0);
  assert.equal(원(r.html,'양도소득세\\(누진세율, 1~2년 미만 보유는 단기세율과 비교\\)'),Math.round(expectedTax));
});
t('조정대상지역 2주택·보유2년 이상·유예기간 내(2026-05-01) -> 한시 배제, 중과 미적용',()=>{
  const r=실행({...기본,'ipt-assetType':'house','ipt-otherHomeAtSale':'yes','ipt-otherHomeCount':'1','ipt-adjustedArea':'yes','ipt-saleDate':'2026-05-01'});
  assert(r.html.includes('다주택 중과 판정</td><td>한시 배제'));
  assert(원(r.html,'장기보유특별공제') > 0);
});
t('비조정대상지역 다주택 -> 중과 없음(입력 기준)',()=>{
  const r=실행({...기본,'ipt-assetType':'house','ipt-otherHomeAtSale':'yes','ipt-otherHomeCount':'1','ipt-adjustedArea':'no','ipt-saleDate':'2026-07-01'});
  assert(r.html.includes('다주택 중과 판정</td><td>중과 대상 아님(비조정대상지역'));
  assert(원(r.html,'장기보유특별공제') > 0);
});
t('조정대상지역 다주택·보유기간 2년 미만·유예기간 내 양도 -> 유예 미적용(여전히 중과, 단기세율과 비교)',()=>{
  const r=실행({...기본,'ipt-assetType':'house','ipt-otherHomeAtSale':'yes','ipt-otherHomeCount':'1','ipt-adjustedArea':'yes','ipt-decedentYears':'0','ipt-inheritDate':'2025-06-01','ipt-saleDate':'2026-01-01'});
  assert(r.html.includes('다주택 중과 판정</td><td>중과 적용(총 2주택, +20%p'));
  const gain=1000000000-700000000-20000000, bd=2500000, taxable=gain-bd;
  const expectedTax=Math.max(c.heavyProg(taxable,20), taxable*0.7);
  assert.equal(원(r.html,'양도소득세\\(누진세율, 1~2년 미만 보유는 단기세율과 비교\\)'),Math.round(expectedTax));
});

console.log(n+' passed');
