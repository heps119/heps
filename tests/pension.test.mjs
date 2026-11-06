// 연금계좌세액공제(소득세법 §59의3①, 2023.1.1~) 회귀 테스트: index.html 소스 문구 점검
import fs from 'node:fs'; import assert from 'node:assert';
const s=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let n=0; const t=(m,f)=>{f();n++;console.log('ok',m)};
t('공제율 16.5/13.2',()=>assert(s.includes("isLowerBracket ? 0.165 : 0.132")));
t('합산 한도 900',()=>assert(s.includes("penPensionCreditBase(pensionContribution,")));
t('기준 5,500/4,500',()=>assert(s.includes("earnedIncome <= 5500")&&s.includes("comprehensiveIncome <= 4500")));
t('시행령 위임 오기재 제거',()=>assert(!s.includes("법률이 아니라 같은 법 시행령에 위임")));
t('연금저축 분리 입력란',()=>assert(s.includes('id="pen-pension-savings"')));
// 법정 계산 재현: 900 납입, 총급여 5,500 → 148.5만원 / 6,000 → 118.8만원
const c=(k,r)=>Math.round(Math.min(k,900)*r);
t('계산 예',()=>{assert.equal(c(900,0.165),149);assert.equal(c(900,0.132),119);});
import { 함수추출 } from './extract.mjs'; import vm from 'node:vm';
const ctx={}; vm.createContext(ctx); vm.runInContext(함수추출(s.replace(/\r\n/g,'\n'),'penPensionCreditBase')+'\nthis.f=penPensionCreditBase;',ctx);
const f=ctx.f;
t('분리 입력 없음 → 900 한도',()=>{assert.equal(f(1000,null),900);assert.equal(f(500,null),500);});
t('연금저축만 900 → 600',()=>assert.equal(f(900,900),600));
t('연금저축 600 + IRP 300 → 900',()=>assert.equal(f(900,600),900));
t('연금저축 800 + IRP 300 → 600+300=900',()=>assert.equal(f(1100,800),900));
t('연금저축 300 + IRP 700 → 1000 → 900',()=>assert.equal(f(1000,300),900));
t('연금저축 300 + IRP 200 → 500',()=>assert.equal(f(500,300),500));
t('연금저축 > 총납입 → 총납입으로 제한',()=>assert.equal(f(400,900),400));
console.log(n+' passed');
