// 부동산 평가(calcRealEstate/computeHomeChun): 상증법 §61⑤·시행령 §50⑦·시행규칙 §15의2(12%) 회귀 테스트. 단위: 천원
import fs from 'node:fs'; import assert from 'node:assert'; import vm from 'node:vm';
import { 함수추출 } from './extract.mjs';
const s=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
let n=0; const t=(m,f)=>{f();n++;console.log('ok',m)};
const 코드=['parseNum','computeHomeChun','calcRealEstate','fmtRe'].map(x=>함수추출(s,x)).join('\n')+'\nthis.run=calcRealEstate;';
function 실행(v){
  const out={reTotal:null};
  const el=(id)=>{ if(id==='reBuildingResult'||id.startsWith('re-')) return {classList:{add(){},remove(){}},set textContent(x){out[id]=x}}; if(['c_land','c_building_std','c_rent_deposit','c_rent_annual'].includes(id)&&!(id in v)) return {value:''}; if(id in v) return {value:String(v[id]),checked:!!v[id+'__chk']}; return null; };
  const c={document:{getElementById:el},calcTotalAsset:(x)=>{out.reTotal=x},Math,parseFloat,String,Number};
  vm.createContext(c); vm.runInContext(코드,c); c.run(); return out;
}
t('임대 없음: 기준시가 합',()=>assert.equal(실행({c_land:'300000',c_building_std:'200000'}).reTotal,500000));
t('환산가액 = 보증금 + 연임대료/0.12',()=>{const r=실행({c_land:'100000',c_building_std:'100000',c_rent_deposit:'300000',c_rent_annual:'12000'});assert.equal(r.reTotal,400000);});
t('기준시가가 더 크면 기준시가',()=>assert.equal(실행({c_land:'500000',c_building_std:'300000',c_rent_deposit:'100000',c_rent_annual:'12000'}).reTotal,800000));
t('자택은 MAX 밖에서 합산',()=>assert.equal(실행({c_land:'500000',c_building_std:'300000',c_rent_deposit:'700000',c_rent_annual:'12000',c_home:'300000'}).reTotal,800000+300000));
t('자택 임대 중: MAX(평가액, 보증금+연임대료/12%)',()=>assert.equal(실행({c_home:'300000',c_home__chk:1,c_home_rented:'1',c_home_rented__chk:1,c_home_rent_deposit:'200000',c_home_rent_annual:'24000'}).reTotal,400000));
t('환산율 12% 소스 고정',()=>assert(s.includes('Math.round(rentAnnChun / 0.12)')));
console.log(n+' passed');
