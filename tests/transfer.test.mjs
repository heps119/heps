// 상속부동산 처분 양도세 시뮬레이터(iptCalc): 소득세법 §55①(누진세율), §95②·④(장특), §104①②(단기세율) 회귀 테스트
import fs from 'node:fs'; import assert from 'node:assert'; import vm from 'node:vm';
import { 함수추출 } from './extract.mjs';
const s=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
let n=0; const t=(m,f)=>{f();n++;console.log('ok',m)};
const 코드=['iptProgressiveTax','iptLtcTable1','iptShortTermRate','iptYearsBetween','iptDaysBetween','iptCalc'].map(x=>함수추출(s,x)).join('\n')
 +'\nvar iptWon=function(n){return Math.round(n).toLocaleString("ko-KR")+"원"};\nthis.run=iptCalc;this.prog=iptProgressiveTax;this.ltc=iptLtcTable1;this.st=iptShortTermRate;';
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
console.log(n+' passed');
