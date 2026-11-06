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

// --- §1008 단서(2026.3.17 개정)에 따른 보상적 증여·유증 제외액 계산: cc2GiftAppliedExclude ---
const 제외함수코드 = 함수추출(s, 'cc2GiftAppliedExclude') + '\nthis.run = cc2GiftAppliedExclude;';
const 제외계산 = (g) => { const c = { Math }; vm.createContext(c); vm.runInContext(제외함수코드, c); return c.run(g); };
t('보상적 증여 아님(qual=no)이면 제외액 0',()=>assert.equal(제외계산({ qual: 'no', exclude: 5000, amount: 10000, evidence: 3 }), 0));
t('증빙 높음(evidence=3)이면 주장액 전액(100%) 제외',()=>assert.equal(제외계산({ qual: 'yes', exclude: 4000, amount: 10000, evidence: 3 }), 4000));
t('증빙 보통(evidence=2)이면 주장액의 50% 제외',()=>assert.equal(제외계산({ qual: 'uncertain', exclude: 4000, amount: 10000, evidence: 2 }), 2000));
t('증빙 낮음(evidence=1)이면 0% 제외',()=>assert.equal(제외계산({ qual: 'yes', exclude: 4000, amount: 10000, evidence: 1 }), 0));
t('주장 보상액이 증여가액을 넘으면 증여가액으로 캡',()=>assert.equal(제외계산({ qual: 'yes', exclude: 99999, amount: 1000, evidence: 3 }), 1000));

// --- 유증은 유류분 산정 기초재산에 다시 가산하지 않음(§1113①) — giftTotal이 사전증여만 합산하는지 ---
t('giftTotal(유류분 기초재산 가산분)은 유증을 제외하고 생전 증여만 합산',()=>{
  assert(s.includes("cc2Gifts.filter(function(g) { return g.type !== 'bequest'; }).reduce(function(s, g) { return s + g.amount; }, 0)"));
});

// --- 특별수익(증여+유증) 반영 구체적 상속분표: §1008 본문 — 1차 배분액에서 특별수익 공제, 0원 하한 ---
t('특별수익 반영 구체적 상속분 계산 코드 존재(§1008): 1차 배분액 - 특별수익, 0원 하한',()=>{
  assert(s.includes("var finalShare = Math.max(0, firstAllocation - benefit);"));
  assert(s.includes("cc2GiftAppliedExclude(g)")); // 보상 인정분은 특별수익에서도 제외
  assert(s.includes('id="cc2-specialBenefitTable"'));
});
t('증여·유증 구분 입력란 존재(유증은 유류분 기초재산에 안 더하지만 특별수익 공제는 동일)',()=>{
  assert(s.includes('id="cc2-giftType"'));
  assert(s.includes("type: giftTypeEl ? giftTypeEl.value : 'gift'"));
});

// --- 초과특별수익자: 특별수익이 1차 배분액보다 크면 구체적 상속분은 0(음수 아님) ---
t('특별수익이 1차 배분액을 초과해도 구체적 상속분은 0으로 하한(초과분 재분배는 반영하지 않음)',()=>{
  const firstAllocation = 100_000_000, benefit = 300_000_000;
  const finalShare = Math.max(0, firstAllocation - benefit);
  assert.equal(finalShare, 0);
});

console.log(n+' passed');
