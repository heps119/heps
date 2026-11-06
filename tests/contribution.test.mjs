// 기여상속·유류분 시뮬레이터(cc2*) 회귀 테스트: 민법 제1009조②, 제1112조, 제1113조 반영 확인
import fs from 'node:fs'; import assert from 'node:assert'; import vm from 'node:vm';
import { 함수추출 } from './extract.mjs';
const s=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
let n=0; const t=(m,f)=>{f();n++;console.log('ok',m)};
const 입력={'cc2-spouse':1,'cc2-children':2,'cc2-parents':0};
const 코드=['cc2Num','cc2Heirs','cc2Shares'].map(x=>함수추출(s,x)).join('\n')+'\nthis.run=()=>cc2Shares(cc2Heirs());';
const mk=(v)=>{const c={document:{getElementById:(id)=>id in v?{value:String(v[id])}:null},Math,Number,Intl};vm.createContext(c);vm.runInContext(코드,c);return c.run();};
t('배우자1+자녀2: 3/7, 2/7, 2/7 (§1009②)',()=>{const r=mk(입력);assert(Math.abs(r[0].share-3/7)<1e-9);assert(Math.abs(r[1].share-2/7)<1e-9);});
t('유류분율: 배우자·직계비속 1/2 (§1112 1·2호)',()=>mk(입력).forEach(h=>assert.equal(h.rate,0.5)));
t('직계존속 1/3 (§1112 3호), 자녀 없을 때만 상속인',()=>{const r=mk({'cc2-spouse':1,'cc2-children':0,'cc2-parents':2});assert(r.filter(h=>h.type==='parent').every(h=>h.rate===1/3));assert(Math.abs(r[0].share-1.5/3.5)<1e-9);});
t('자녀가 있으면 직계존속 제외',()=>assert(!mk({'cc2-spouse':0,'cc2-children':1,'cc2-parents':2}).some(h=>h.type==='parent')));
t('산정식 §1113①: 순재산+증여 기초, 보상적 증여 제외 반영 코드 존재',()=>{assert(s.includes('var baseBefore = net + giftTotal;'));assert(s.includes('var baseFinal = Math.max(0, baseBefore - combinedGiftExclude);'));});
t('형제자매 문구가 현행 §1112 기준',()=>assert(s.includes('현행 민법 제1112조(제4호 삭제)')));
console.log(n+' passed');
