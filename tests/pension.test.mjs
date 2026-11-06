// 연금계좌세액공제(소득세법 §59의3①, 2023.1.1~) 회귀 테스트: index.html 소스 문구 점검
import fs from 'node:fs'; import assert from 'node:assert';
const s=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let n=0; const t=(m,f)=>{f();n++;console.log('ok',m)};
t('공제율 16.5/13.2',()=>assert(s.includes("isLowerBracket ? 0.165 : 0.132")));
t('합산 한도 900',()=>assert(s.includes("Math.min(pensionContribution, 900)")));
t('기준 5,500/4,500',()=>assert(s.includes("earnedIncome <= 5500")&&s.includes("comprehensiveIncome <= 4500")));
t('시행령 위임 오기재 제거',()=>assert(!s.includes("법률이 아니라 같은 법 시행령에 위임")));
t('연금저축 600 안내',()=>assert(s.includes("연금저축만</strong> 넣으시면 600만원")));
// 법정 계산 재현: 900 납입, 총급여 5,500 → 148.5만원 / 6,000 → 118.8만원
const c=(k,r)=>Math.round(Math.min(k,900)*r);
t('계산 예',()=>{assert.equal(c(900,0.165),149);assert.equal(c(900,0.132),119);});
console.log(n+' passed');
