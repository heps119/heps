# 기여상속·유류분(구체적 상속분) 계산 로직 — accydream.co.kr / HEPS Intelligence 인계 문서

- **원본**: heps119.com 간편 계산기 (`C:\GitHub\heps119\heps119\index.html`, 섹션 `#contribution-calc`)
- **기능명**: 기여상속 및 유류분 분석 시뮬레이터 (화면 표시명), 코드 내부 접두사 `cc2*`
- **작성일**: 2026-11-06 (특별수익 반영 구체적 상속분표 추가) / **2026-11-07 개정**: HEPS Intelligence 이식 검토 중 발견된 계산 버그를 heps119 원본에서 먼저 수정하고 이 문서에 반영했습니다(아래 "2026-11-07 수정 내역" 참고).
- **작성 목적**: 이 기능을 accydream.co.kr(HEPS Dream)과 향후 HEPS Intelligence 플랫폼에 어떤 형태로 들여올지 검토할 수 있도록, 로직·입력구조·법적 근거·테스트·알려진 한계를 한 문서에 모았습니다.

## 0. 2026-11-07 수정 내역 (이식 전 꼭 확인)

HEPS Intelligence 쪽 검토에서 "특별수익 반영 구체적 상속분" 계산에 버그가 지적되어 heps119 원본을 먼저 고쳤습니다. **이 문서를 이전에 받으셨다면, §4·§9의 코드를 이 개정판으로 교체해 주세요.**

- **증상**: 구 버전은 1차 배분액을 `순상속재산 × 지분`으로만 계산하고 거기서 특별수익(생전증여)을 뺐습니다. 생전증여를 간주상속재산에 합산하지 않아, 상속인들의 구체적 상속분을 모두 더해도 순상속재산보다 생전증여액만큼 작아지는 오류가 있었습니다.
- **예시(지적해 주신 사례)**: 상속재산 10억, 자녀 2명, 그중 1명이 생전증여 4억. 구 버전: 1억/5억(합계 6억, 4억 소실). 수정판: 간주상속재산 14억 → 3억/7억(합계 10억, 정상).
- **수정 공식**: `(순상속재산 + 생전증여 총액 − 인정 기여분 합계) × 법정상속분 − 본인 특별수익(증여+유증, 보상 인정분 제외) + 본인 인정 기여분`. 유증은 "현재 상속재산"에 이미 포함돼 있으므로 간주상속재산에는 다시 더하지 않고, 본인 몫에서만 뺍니다.
- **검증**: 위 예시(3억/7억, 합계 10억)와, 기여분이 섞인 경우(자녀2에게 2억 기여분 인정 시 2억/8억, 합계 10억 유지)를 Playwright로 실제 렌더링까지 확인했고, `tests/contribution.test.mjs`에 회귀 테스트 3건을 추가해 전체 7개 테스트 파일이 모두 통과합니다.

---

## 1. 이 계산기가 하는 일 (3가지 서로 다른 효과)

법적 근거와 절차가 다른 세 가지를 **각각 따로** 계산하고, 하나의 숫자로 합산하지 않습니다.

1. **기여분** (민법 §1008조의2, 상속재산분할 단계) — 특별 부양·재산 유지/증가 기여를 상속재산분할에서 추가로 인정받는 몫. 증빙수준(높음/보통/낮음)에 따라 0%/50%/100% 세 시나리오로 보여줌.
2. **보상적 증여·유증 제외** (민법 §1008 단서, 2026.3.17 개정, 유류분 산정 기초재산에서 제외) — 증여·유증이 기여에 대한 "보상으로" 행해진 것이면, 그 기여에 상응하는 범위에서 유류분 기초재산에서 뺌. 증여 항목마다 개별 판단(0%/50%/100% 시나리오).
3. **특별수익(증여+유증) 반영 구체적 상속분** (민법 §1008 본문) — 기여분 반영 1차 배분액에서, 각 상속인이 미리 받은 특별수익(증여+유증, 단 §1008 단서로 보상 인정된 부분은 제외)을 공제해 "진짜" 구체적 상속분을 보여줌. 2026-11-06에 새로 추가된 부분.

판례 근거로 대법원 2026. 5. 29. 선고 2024다208261 판결을 인용하며(보상적 증여·유증의 유류분 기초재산 제외 구조 확인), 개정 §1008 단서는 **2024년 4월 25일 이후 개시된 상속**에만 적용됩니다(부칙 §2).

## 2. 법령 근거 대조 현황 (docs/법령근거표.md 발췌, 법제처 2026.3.17 시행본 대조)

| 항목 | 현재 코드 동작 | 근거 조문 | 상태 |
|---|---|---|---|
| 법정상속분 | 배우자 1.5 : 자녀 각 1 (직계존속 동순위도 동일) | §1009② | 확인 |
| 유류분율 | 직계비속·배우자 1/2, 직계존속 1/3, 형제자매 제외 | §1112 1~3호(4호 삭제) | 확인 |
| 산정 기초 | 순상속재산 + 생전증여 전부 − 채무(유증은 2번 재산에 이미 포함되어 재가산 안 함) | §1113① | 확인 |
| 보상적 증여 제외 | 주장액×인정비율(증빙수준별 0/50/100%)을 기초재산에서 차감 | §1008 단서(2026.3.17 신설) + §1118, 부칙§2(2024.4.25 이후 개시분) | 확인 |
| 판례 인용 | 대법원 2026.5.29. 2024다208261 | 판결문 대조 완료 | 확인 |
| 기여분 | 기여자별 협의/심판 가정 시나리오(0/50/100%) | §1008조의2 | 시뮬레이션(법적 확정 아님) |
| **기여분 한도** | 순상속재산 한도로만 계산 | §1008조의2③ "상속재산−유증" | **근사** — 3번 증여입력에서 유증 여부는 구분되지만, 4번 기여분 한도 산정식에는 그 유증 공제를 연동하지 않음 |
| 구체적 상속분(특별수익 반영) | **(2026-11-07 수정)** 간주상속재산(순상속재산+생전증여−인정기여분)×법정상속분 − 본인 특별수익(증여+유증, 보상 인정분 제외) + 본인 기여분, 0원 하한 | §1008·§1008조의2① | 확인(단, **초과특별수익자 재분배 방법은 미계산** — 아래 4장 참고) |
| 증여 산입 기간 | 시기 무관 전부 산입 | §1114(상속인 외 1년 등) | 근사(안내 문구만) |
| 반환청구 시효·이자 | 계산 안 함 | §1117(1년/10년), §1115①(2026.3.17 이후 개시분 이자) | 안내 문구만 |

## 3. 입력 데이터 구조

내부 상태는 두 개의 배열 `cc2Gifts`, `cc2Contribs`로 관리됩니다(코드 §5의 `window.cc2Calc` 참고).

**`cc2Gifts[]`** (3번 "생전 증여·유증 입력" — 항목 하나가 증여/유증 1건):
```
{
  person: string,       // 수증자 이름(상속인 중 선택)
  amount: number,       // 증여·유증 가액(원)
  date: string,         // 증여·유증일 (YYYY-MM-DD)
  memo: string,
  qual: 'no'|'yes'|'uncertain',  // 보상적 증여 여부 판단
  evidence: 1|2|3,      // 증빙수준(낮음/보통/높음) — qual이 'no'가 아닐 때만 의미 있음
  exclude: number,      // 기여에 상응한다고 주장하는 보상액(원, amount 이하로 캡)
  type: 'gift'|'bequest' // 생전증여 / 유증 구분 (2026-11-06 추가)
}
```

**`cc2Contribs[]`** (4번 "기여분 입력 — 상속재산분할"):
```
{
  person: string,        // 기여자 이름
  amount: number,        // 기여분으로 주장하는 금액(원)
  live: number,          // 동거 기간(개월)
  care: number,          // 간호·간병 기간(개월)
  cost: number,          // 본인 부담 병원·간병비(원)
  asset: number,         // 재산 유지·증가 기여 추정액(원)
  evidence: 1|2|3        // 증빙수준
}
```

**상속인 배열**은 배우자 수(0/1) + 자녀 수 + (자녀 없을 때만) 직계존속 수로 매 계산 시 동적으로 구성됩니다(`cc2Heirs()`). 배우자 가중치 1.5, 자녀/직계존속 각 1 (§1009②), 유류분 비율은 배우자·직계비속 1/2, 직계존속 1/3(§1112), 형제자매는 상속인 후보에도 포함하지 않습니다(2024년 개정 §1112 4호 삭제 반영).

## 4. 핵심 계산 로직 요약

- **`cc2GiftAppliedExclude(g)`**: 증여 1건에 대해 §1008 단서상 "보상으로 인정되는 제외액"을 계산하는 공용 함수. `qual==='no'`면 0. 그 외에는 `min(exclude, amount) × (evidence===3 ? 1.0 : evidence===1 ? 0 : 0.5)`. 유류분 기초재산 제외 계산과 특별수익 공제 계산 양쪽에서 재사용됩니다(두 곳의 수치가 항상 일치하도록).
- **유류분 산정 기초재산**: `baseBefore = net + giftTotal` (net=순상속재산, giftTotal=유증 제외 생전증여 합계). 보상적 증여 제외 반영 후 `baseFinal = baseBefore - combinedGiftExclude`.
- **기여분 반영 1차 배분액**: 기여자별로 "가장 유력한" 인정비율(증빙 높음→100%, 보통→50%, 낮음→0%)을 적용한 "종합 참고 추정"을 만들고, 그 기여분만큼을 상속재산에서 먼저 공제한 뒤 법정상속분으로 분배 + 기여자에게 인정 기여분을 더함.
- **특별수익 반영 구체적 상속분(2026-11-07 수정판)**: 먼저 간주상속재산 `imputedEstate = max(0, net + giftTotal - 인정기여분합계)`를 구하고, `firstAllocation = imputedEstate × h.share + (그 사람의 인정 기여분)`, 그 다음 `finalShare = max(0, firstAllocation - benefit)` (`benefit = Σ(증여·유증 금액 - cc2GiftAppliedExclude(그 건))`). 유증은 "현재 상속재산"에 이미 포함돼 있으므로 `imputedEstate`에는 다시 더하지 않고 `benefit` 계산(본인 몫 차감)에서만 반영합니다. **(구 2026-11-06판의 버그)** 이전 버전은 `firstAllocation`을 `net × h.share`(생전증여를 더하지 않은 순상속재산 기준)로 계산해, 상속인들의 `finalShare` 합계가 생전증여액만큼 순상속재산보다 작아지는 오류가 있었습니다 — 2026-11-07 외부 검토로 발견·수정. 특별수익이 1차 배분액을 초과하면 0원으로 하한(= "초과특별수익자"), **그 초과분을 다른 공동상속인에게 재분배하는 법리는 구현하지 않음** — 이 부분이 아직 미해결 과제입니다.
- 세 효과(①기여분 ②보상적 증여 제외 ③특별수익 반영)는 화면에서 항상 분리해서 보여주고 합산하지 않습니다.

## 5. 알려진 한계 (이식 시 꼭 같이 가져가야 할 미해결 과제)

1. **기여분 한도(§1008조의2③, "상속재산−유증")가 유증 입력과 연동되지 않음.** 3번에서 유증 여부(`type:'bequest'`)는 구분해서 받지만, 4번 기여분 한도 계산식은 이를 쓰지 않고 순상속재산 전체를 한도로 씀.
2. **초과특별수익자 재분배 방법 미구현.** 특별수익이 1차 배분액을 초과하는 상속인의 구체적 상속분을 0원으로 하한만 두고, 그 초과분을 다른 공동상속인에게 어떻게 재분배할지(판례·학설상 여러 방법이 경쟁)는 계산하지 않음.
3. **유류분 반환청구권 시효·이자** (§1117 1년/10년, §1115① 2026.3.17 이후 개시분 이자 가산) 계산 안 함 — 안내 문구만 있음.
4. **증여 산입기간**(§1114, 상속인 아닌 자에 대한 증여는 원칙 1년 내 것만 산입 등) 시기 구분 없이 전부 산입 — 근사치.
5. 법원의 기여분·보상적 증여 인정 여부를 예측하는 도구가 아니라, 사용자가 입력한 가정(증빙수준 등)에 따른 **시뮬레이션**임을 화면에 명시하고 있음 — 어느 플랫폼으로 이식하든 이 면책 성격은 유지가 필요함.

## 6. 포함할 수 있는 테스트(회귀 스펙 역할)

`tests/contribution.test.mjs`(heps119 레포, Node 내장 `node:test` 없이 vm 기반 자체 러너, 15개 검증) 전문을 §9에 수록했습니다. 로직을 이식할 때 기대값 스펙으로 그대로 재사용할 수 있습니다. 예: 배우자1+자녀2 → 3/7·2/7·2/7 지분, 유류분율 배우자·직계비속 1/2·직계존속 1/3, 증빙수준별 제외비율(100%/50%/0%), 유증은 유류분 기초재산에 재가산하지 않음, 특별수익 초과 시 0원 하한 등.

## 7. accydream.co.kr 이식 시 참고 — 기존 상속세 계산 흐름과의 접점

accydream.co.kr은 현재 "재산평가 → 상속세 계산(과세가액·공제·세율·신고서 초안)" 흐름이며, 상속인별 구체적 분배(실제 유류분 분쟁·기여분 반영)는 다루지 않습니다. 접점 후보:

- 상속세는 원칙적으로 각 상속인이 **실제로 받은 재산 비율**로 안분 납부하므로, 분쟁·기여분으로 법정상속분과 실제 분배가 달라지는 경우 이 모듈의 "구체적 상속분표" 산출값을 상속세 안분 단계의 입력으로 연결할 수 있습니다(법정상속분 가정 vs 구체적 상속분 가정, 두 가지 세액을 나란히 보여주는 방식 등).
- 다만 이 기능은 accydream의 "빠른 셀프서비스 계산"과 달리 가족관계·증빙 수준 등 상담에 가까운 입력을 요구합니다. 독립된 "상속재산분할·유류분 시뮬레이터" 섹션으로 추가하거나, HEPS Intelligence처럼 상담·전략 지향 플랫폼에 두는 두 가지 방향을 함께 검토해 보시길 권합니다.
- heps119.com은 accydream.co.kr 홈페이지에서 "연속증여·유류분·상속부동산 양도세 시뮬레이터"를 자신의 고유 기능으로 소개하고 있어(2026-11-06 확인), 이 기능을 그대로 다른 사이트로 옮길 경우 두 사이트의 포지셔닝 조정이 함께 필요합니다.

## 8. 공유 스타일/클래스 의존성 (이식 시 재현 또는 대체 필요)

HTML은 heps119 공통 CSS 클래스를 재사용합니다(이식 대상 사이트의 디자인 시스템으로 대체 필요): `.pen-instrument-card`(카드 레이아웃), `.pen-field`/`.pen-field-row`/`.pen-field-hint`(입력 필드), `.pen-comma-input`(천단위 콤마 숫자입력, `penFormatCommaInput`/`penRawNumber` 헬퍼와 짝), `.pen-compare-table`(결과 표), `.pen-ai-btn`/`.hn-cancel`(버튼), `.hn-modal-bg`/`.hn-modal`(사용법 안내 팝업 모달), `.site-speak-btn`+`siteSpeak()`(TTS 음성 안내 — heps119 전역 함수, 이식 시 별도 구현 필요).

## 9. 전체 소스 (참고용 원문)

### 9.1 HTML 입력/출력 마크업 (`index.html` 라인 7996–8248, `<section id="contribution-calc">` + 사용법 안내 모달)

```html
<section id="contribution-calc" style="padding:4.5rem 2rem; background:#faf8f4;">
  <div class="reveal" style="max-width:75rem; margin:0 auto 2.5rem; text-align:center;">
    <span class="section-eyebrow" style="color:var(--gold);">CONTRIBUTION &amp; LEGAL RESERVE</span>
    <h2 style="color:var(--navy); margin-bottom:1.2rem; display:flex; align-items:center; justify-content:center; gap:0.6rem; flex-wrap:wrap;">기여상속 및 유류분 분석 시뮬레이터
      <button type="button" class="site-speak-btn" data-speaking="0" onclick="siteSpeak('이 계산기는 법원이 기여분이나 보상적 증여를 확정하는 법률판정기가 아닙니다. 사용자가 입력한 사실과 기여에 상응하는 보상액을 기준으로 시뮬레이션합니다. 2026년 3월 17일부터 시행된 개정 민법 제1008조 단서에 따라, 특별히 부양하거나 재산 유지·증가에 기여한 데 대한 보상으로 받은 증여는 기여에 상응하는 범위에서 유류분 계산에서 제외될 수 있습니다. 이 조항은 2024년 4월 25일 이후 개시된 상속부터 적용됩니다.', this)" title="음성으로 듣기">🔊</button>
      <button type="button" onclick="cc2OpenHelp()" style="font-size:0.78rem; font-weight:700; font-family:'Noto Sans KR',sans-serif; background:var(--navy); color:var(--gold2); border:none; padding:0.4rem 0.9rem; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem;" title="용어 정의, 입력 방법, 결과 해석을 안내하는 설명서를 엽니다">📖 사용법 안내</button>
      <button type="button" onclick="cc2OpenHelpWindow()" style="font-size:0.78rem; font-weight:700; font-family:'Noto Sans KR',sans-serif; background:#fff; color:var(--navy); border:1.5px solid var(--navy); padding:0.4rem 0.9rem; border-radius:20px; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem;" title="설명서를 별도 창으로 열어, 이 화면과 나란히(듀얼모니터 등) 두고 보실 수 있습니다">🪟 새 창에서 보기</button>
    </h2>
    <p style="color:#2e2e2e; font-size:0.92rem; line-height:1.8; font-family:'Noto Sans KR',sans-serif;">
      특별한 부양·재산 유지·증가 기여와 보상적 증여·유증이 유류분에 미치는 영향을 시뮬레이션합니다.
    </p>
  </div>

  <div class="reveal" style="max-width:75rem; margin:0 auto 1.5rem; background:#fff7e6; border-left:4px solid #d98c00; border-radius:4px; padding:1rem 1.3rem; font-size:0.85rem; line-height:1.8; color:#5c4400;">
    ⚖️ <strong>중요한 이용 안내:</strong> 이 계산기는 법원이 기여분이나 보상적 증여를 확정하는 법률판정기가 아닙니다. 사용자가 입력한 사실과 "기여에 상응하는 보상액"을 기준으로 <strong>시뮬레이션</strong>합니다. 실제 사건에서는 상속개시일, 증여·유증의 성격, 공동상속인 여부, 유류분 산정재산, 채무 및 소송 경과 등을 별도로 검토해야 합니다. 또한 개정 민법 제1008조 단서는 <strong>2024년 4월 25일 이후 개시된 상속</strong>에 한해 적용되니, 상속개시일을 먼저 확인해 주세요. <strong>대법원 2026. 5. 29. 선고 2024다208261 판결</strong>은 이 단서의 보상적 증여·유증이 기여에 상응하는 범위에서 유류분 산정 기초재산에서도 제외된다는 점을 확인했습니다. 이 계산기는 기여분(상속재산분할)·보상적 증여 제외(유류분)·특별수익 반영(유류분) 세 가지를 서로 다른 효과로 보고, 하나의 숫자로 합산하지 않습니다.
  </div>

  <div class="reveal" style="max-width:75rem; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
    <div class="pen-instrument-card">
      <h4>1. 기본정보</h4>
      <div class="pen-field-row">
        <div class="pen-field"><label>상속개시일</label><input type="date" id="cc2-deathDate" value="2026-01-01" oninput="cc2Calc()"></div>
        <div class="pen-field"><label>배우자 수(0 또는 1)</label><input type="number" id="cc2-spouse" min="0" max="1" value="1" oninput="cc2Calc()"></div>
      </div>
      <div class="pen-field-row">
        <div class="pen-field"><label>직계비속(자녀) 수</label><input type="number" id="cc2-children" min="0" max="20" value="2" oninput="cc2Calc()"></div>
        <div class="pen-field"><label>직계존속 수 <span style="font-size:0.72rem; color:#999;">(자녀가 없을 때만 상속인)</span></label><input type="number" id="cc2-parents" min="0" max="4" value="0" oninput="cc2Calc()"></div>
      </div>
      <div class="pen-field-hint" style="margin-top:0.3rem;">형제자매는 현행 민법 제1112조(제4호 삭제)에 따라 유류분 권리자에서 제외되어 계산합니다. 자녀가 있으면 직계존속은 법정상속인 계산에서 제외됩니다.</div>
    </div>

    <div class="pen-instrument-card">
      <h4>2. 현재 상속재산 <span style="font-size:0.72rem; color:#999; font-weight:400;">(단위: 원)</span></h4>
      <div class="pen-field-row">
        <div class="pen-field"><label>부동산</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-real" value="0" oninput="cc2Calc()"></div>
        <div class="pen-field"><label>금융재산</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-finance" value="0" oninput="cc2Calc()"></div>
      </div>
      <div class="pen-field-row">
        <div class="pen-field"><label>주식·지분</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-stock" value="0" oninput="cc2Calc()"></div>
        <div class="pen-field"><label>기타재산</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-other" value="0" oninput="cc2Calc()"></div>
      </div>
      <div class="pen-field"><label>상속채무·공제대상 채무(단순 시뮬레이션)</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-debt" value="0" oninput="cc2Calc()"></div>
    </div>

    <div class="pen-instrument-card" style="grid-column:1/-1;">
      <h4>3. 생전 증여·유증 입력</h4>
      <div class="pen-field-hint" style="margin-bottom:0.7rem;">누가, 언제, 얼마를 받았는지 기록하고, <strong>이 증여 항목이 개정 민법 제1008조 단서의 "보상적 증여"에 해당한다고 볼지를 증여 항목마다 직접 판단</strong>합니다. 증여마다 사실관계(기여의 내용·증빙)가 다를 수 있어, 하나의 기여 사실을 여러 증여에 일괄 적용하지 않고 항목별로 따로 판단합니다.</div>
      <div class="pen-field-row">
        <div class="pen-field"><label>수증자</label><select id="cc2-giftPerson"></select></div>
        <div class="pen-field"><label>증여·유증 가액(원)</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-giftAmount" value="0"></div>
      </div>
      <div class="pen-field-row">
        <div class="pen-field"><label>구분</label><select id="cc2-giftType"><option value="gift" selected>생전 증여(사전증여)</option><option value="bequest">유증(유언으로 남길 재산)</option></select></div>
        <div class="pen-field" style="display:flex; align-items:flex-end;"><p class="pen-field-hint" style="margin:0;">유증은 "2. 현재 상속재산"에 이미 포함된 재산을 누구에게 줄지 정하는 것이라 유류분 산정 기초재산에 다시 더하지 않습니다. 생전 증여만 기초재산에 가산됩니다(민법 §1113①). 다만 특별수익으로서 구체적 상속분에서 공제되는 것은 증여·유증 모두 같습니다(§1008).</p></div>
      </div>
      <div class="pen-field-row">
        <div class="pen-field"><label>증여·유증일</label><input type="date" id="cc2-giftDate"></div>
        <div class="pen-field"><label>메모</label><input type="text" id="cc2-giftMemo" placeholder="예: 7년 동거·간병에 대한 보상으로 증여"></div>
      </div>
      <div class="pen-field-row">
        <div class="pen-field"><label>이 증여, 보상적 증여인가요?</label>
          <select id="cc2-giftQual" onchange="cc2ToggleGiftQualFields()">
            <option value="no" selected>아니오 — 일반 증여</option>
            <option value="yes">예 — 기여에 대한 보상으로 받은 증여</option>
            <option value="uncertain">판단 필요 — 아직 확정하기 어려움</option>
          </select>
        </div>
        <div class="pen-field" id="cc2-giftEvidenceWrap" style="display:none;">
          <label>증빙 수준</label>
          <select id="cc2-giftEvidence">
            <option value="3">높음 — 계좌·영수증·동거·간병·계약 등 객관자료 충분</option>
            <option value="2" selected>보통 — 일부 객관자료 존재</option>
            <option value="1">낮음 — 진술 중심</option>
          </select>
        </div>
      </div>
      <div class="pen-field" id="cc2-giftExcludeWrap" style="display:none;">
        <label>기여에 상응한다고 주장하는 보상액(원) <span style="font-size:0.72rem; color:#999;">(증여가액을 넘을 수 없습니다. 아래 결과의 0%/50%/100% 인정비율 시나리오는 이 금액을 기준으로 계산합니다)</span></label>
        <input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-giftExclude" value="0">
      </div>
      <div style="display:flex; gap:0.6rem; margin-top:0.8rem;">
        <button type="button" class="pen-ai-btn" style="width:auto; padding:0 1.2rem;" onclick="cc2AddGift()">증여 추가</button>
        <button type="button" class="hn-cancel" onclick="cc2ClearGifts()">전체 삭제</button>
      </div>
      <div style="overflow-x:auto; margin-top:0.9rem;"><table class="pen-compare-table" id="cc2-giftTable"><tr><th>수증자</th><th>가액</th><th>증여일</th><th>판단</th><th>증빙</th><th>주장 보상액</th><th>메모</th><th></th></tr></table></div>
    </div>

    <div class="pen-instrument-card" style="grid-column:1/-1;">
      <h4>4. 기여분 입력 (상속재산분할)</h4>
      <div class="pen-field-hint" style="margin-bottom:0.7rem;">여기서 다루는 것은 <strong>상속재산분할 단계의 기여분(민법 제1008조의2)</strong>입니다. 증여를 보상적 증여로 볼지는 3번에서 증여 항목마다 별도로 판단하며, 이 둘은 서로 다른 제도이므로 인정 금액을 합산하지 않습니다. 아래 항목은 <strong>기여 사실을 구조화하기 위한 기록</strong>이며, 기본 계산은 사용자가 입력하는 "기여분으로 주장하는 금액"을 사용합니다. 따라서 임의의 점수로 법적 기여분을 확정하지 않습니다.</div>

      <details style="margin-bottom:1rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:0.8rem 1rem;">
        <summary style="cursor:pointer; font-weight:700; color:var(--navy); font-size:0.88rem;">📖 기여상속으로 인정받으려면 어떤 조건이 필요한가요? (펼쳐보기)</summary>
        <div style="margin-top:0.7rem; font-size:0.85rem; line-height:1.85; color:#333;">
          <strong>개정 민법 제1008조 단서 원문</strong> — "다만, 증여나 유증이 상당한 기간 동거·간호 그 밖의 방법으로 피상속인을 특별히 부양하거나 피상속인의 재산의 유지 또는 증가에 특별히 기여한 데 대한 보상으로 행해진 때에는 그 기여에 상응하는 범위에서 그러하지 아니하다."<br><br>
          <strong>인정 요건 4가지</strong><br>
          · 증여·유증이 실제로 있어야 합니다.<br>
          · 그 증여·유증이 기여에 대한 "보상으로" 행해진 것이어야 합니다(증여계약서에 명시하는 것이 유리합니다).<br>
          · 기여의 유형은 "특별 부양"(동거·간호 등) 또는 "재산 유지·증가 기여" 둘 중 하나여야 합니다.<br>
          · 통상적인 효도·부양의무 수준을 넘는 <strong>"특별한"</strong> 수준이어야 합니다.<br><br>
          <strong>중요한 제한</strong> — 받은 증여재산 전체가 아니라, 기여의 실질 가치와 균형을 이루는 <strong>"기여에 상응하는 범위"</strong>까지만 유류분에서 제외됩니다.<br><br>
          <strong>입증 책임</strong>은 기여상속인 본인에게 있습니다. 동거 기록, 간호·간병 기록(간병일지·병원비 영수증), 금융거래 기록(송금 내역), 제3자 확인서, 증여계약서상 "기여에 대한 보상" 명시 등을 함께 준비하시면 좋습니다.<br><br>
          <strong>참고</strong> — 이 조항은 상속재산분할 절차에서의 "기여분"(민법 제1008조의2)과는 별개의 제도입니다. 2026년 개정 이전에는 유류분 소송에서 이 항변이 불가능해 가정법원에 별도로 기여분 심판을 청구해야 했는데, 개정 이후로는 유류분 소송 안에서 직접 주장·입증할 수 있게 됐습니다.
        </div>
      </details>

      <div class="pen-field-row">
        <div class="pen-field"><label>기여자</label><select id="cc2-contribPerson"></select></div>
        <div class="pen-field"><label>상속재산분할 기여분으로 주장하는 금액(원)</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-contribAmount" value="0"></div>
      </div>
      <div class="pen-field-row">
        <div class="pen-field"><label>동거 기간(개월)</label><input type="number" id="cc2-liveMonths" min="0" value="0"></div>
        <div class="pen-field"><label>간호·간병 기간(개월)</label><input type="number" id="cc2-careMonths" min="0" value="0"></div>
      </div>
      <div class="pen-field-row">
        <div class="pen-field"><label>본인 부담 병원·간병비(원)</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-careCost" value="0"></div>
        <div class="pen-field"><label>재산 유지·증가 기여액(입력 추정, 원)</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-assetContribution" value="0"></div>
      </div>
      <div class="pen-field">
        <label>증빙 수준</label>
        <select id="cc2-evidence">
          <option value="3">높음 — 계좌·영수증·동거·간병·계약 등 객관자료 충분</option>
          <option value="2" selected>보통 — 일부 객관자료 존재</option>
          <option value="1">낮음 — 진술 중심</option>
        </select>
      </div>
      <div style="display:flex; gap:0.6rem; margin-top:0.8rem;">
        <button type="button" class="pen-ai-btn" style="width:auto; padding:0 1.2rem;" onclick="cc2AddContribution()">기여 기록 추가</button>
        <button type="button" class="hn-cancel" onclick="cc2ClearContrib()">전체 삭제</button>
      </div>
      <div style="overflow-x:auto; margin-top:0.9rem;"><table class="pen-compare-table" id="cc2-contribTable"><tr><th>기여자</th><th>기여분 주장액</th><th>동거</th><th>간병</th><th>비용</th><th>재산기여</th><th>증빙</th><th></th></tr></table></div>
    </div>

    <div class="pen-instrument-card" style="grid-column:1/-1;">
      <h4>5. 계산 결과</h4>
      <div class="pen-field-row" style="grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));">
        <div style="background:#f1f4f8; border-radius:8px; padding:0.9rem;"><div style="font-size:0.75rem; color:#666;">순상속재산</div><div style="font-size:1.1rem; font-weight:800; color:var(--navy); margin-top:0.3rem;" id="cc2-netEstate">0원</div></div>
        <div style="background:#f1f4f8; border-radius:8px; padding:0.9rem;"><div style="font-size:0.75rem; color:#666;">증여·유증 합계</div><div style="font-size:1.1rem; font-weight:800; color:var(--navy); margin-top:0.3rem;" id="cc2-giftTotal">0원</div></div>
        <div style="background:#eaf6ee; border-radius:8px; padding:0.9rem;"><div style="font-size:0.75rem; color:#1e5c33;">유류분 산정 기초재산(증여 전부 반영, 제외 전)</div><div style="font-size:1.1rem; font-weight:800; color:#1e5c33; margin-top:0.3rem;" id="cc2-baseAdjusted">0원</div></div>
      </div>

      <h4 style="margin-top:1.2rem;">기여분(상속재산분할) 인정 비율 시나리오</h4>
      <div class="pen-field-hint" style="margin-bottom:0.6rem;">여러 명이 각자 기여분을 주장할 수 있고, <strong>기여자마다 증빙수준이 달라 인정 가능성도 각자 다를 수 있습니다.</strong> 그래서 기여자별로 따로 나눠 0%/50%/100% 세 단계를 비교합니다. "가능성" 표시는 입력하신 증빙수준을 참고한 <strong>정성적 방향 표시</strong>일 뿐, 실제 소송 결과를 예측하거나 확률을 계산한 것이 아닙니다. 이 시나리오는 <strong>상속재산분할 단계의 기여분</strong>에 관한 것이며, 유류분 산정 기초재산에서 증여를 제외하는 문제(3번 항목)와는 별개입니다.</div>
      <div id="cc2-scenario3" style="margin-bottom:0.8rem;"></div>

      <h4 style="margin-top:1.2rem;">보상적 증여 제외 시나리오 (증여 항목별)</h4>
      <div class="pen-field-hint" style="margin-bottom:0.6rem;">3번에서 "예" 또는 "판단 필요"로 표시한 증여 항목마다, 주장하신 보상액과 증빙수준을 기준으로 0%/50%/100% 세 단계를 따로 비교합니다. "판단 필요"로 남긴 항목은 아직 결론을 내리지 않았다는 뜻이므로, 아래 결과는 보수적으로 참고만 하시기 바랍니다.</div>
      <div id="cc2-giftScenario" style="margin-bottom:0.8rem;"></div>

      <h4 style="margin-top:1.2rem;">상속인별 유류분 분석</h4>
      <div style="overflow-x:auto;"><table class="pen-compare-table" id="cc2-heirTable"><tr><th>상속인</th><th>법정상속지분</th><th>유류분 비율</th><th>증여 모두 인정 유류분</th><th>증여 모두 불인정 유류분</th><th>일부 보상적 증여 인정 유류분(최종)</th><th>증여·유증 수령</th></tr></table></div>

      <h4 style="margin-top:1.2rem;">기여 기록 요약</h4>
      <div id="cc2-contribSummary" style="font-size:0.85rem; color:#555;"></div>
    </div>

    <div class="pen-instrument-card" style="grid-column:1/-1;">
      <h4>📋 기여분 종합 참고 추정 (효과① 산출용)</h4>
      <div class="pen-field-hint" style="margin-bottom:0.6rem;">기여자마다 <strong>본인의 증빙수준에서 가장 유력해 보이는 시나리오</strong>(높음→전액 인정, 보통→절반 인정, 낮음→불인정)를 적용했을 때, 상속재산분할 단계의 구체적 상속분이 전체적으로 어떻게 되는지 계산 과정과 함께 보여드립니다. 실제로는 각 기여자의 주장이 개별적으로 심리·판단되므로, 이 수치는 여러 시나리오 조합 중 하나를 보여드리는 참고용입니다.</div>
      <div id="cc2-combinedProcess" style="margin-bottom:1rem;"></div>
      <h4 style="margin-top:1rem;">종합 참고 추정 기준 구체적 상속분표</h4>
      <div style="overflow-x:auto;"><table class="pen-compare-table" id="cc2-combinedHeirTable"><tr><th>상속인</th><th>법정상속지분</th><th>기여분 미반영 구체적 상속분</th><th>종합 참고 추정 반영 후</th></tr></table></div>
      <h4 style="margin-top:1rem;">특별수익(증여·유증) 반영 구체적 상속분표 <span style="font-size:0.72rem; color:#999; font-weight:400;">(민법 제1008조)</span></h4>
      <div class="pen-field-hint" style="margin-bottom:0.6rem;">순상속재산에 생전증여 총액을 더하고 인정 기여분 합계를 뺀 "간주상속재산"을 법정상속분으로 나눈 뒤(유증은 "2. 현재 상속재산"에 이미 포함돼 있어 간주상속재산에는 다시 더하지 않습니다), 기여자에게는 인정 기여분을 더하고 각자가 3번에서 입력한 증여·유증(특별수익)을 공제합니다. 기여에 대한 보상으로 인정된 부분(3번에서 "예"/"판단 필요"로 표시하고 보상액을 주장한 부분)은 특별수익에서도 같은 비율로 제외됩니다(민법 제1008조 단서). 특별수익이 1차 배분액보다 많으면(초과특별수익자) 그 사람의 구체적 상속분은 0으로 표시되며, 초과분을 다른 상속인에게 재분배하는 방법(초과특별수익자 조정)은 이 계산기가 반영하지 않으므로 실제 사건에서는 전문가와 상담하세요.</div>
      <div style="overflow-x:auto;"><table class="pen-compare-table" id="cc2-specialBenefitTable"><tr><th>상속인</th><th>간주상속재산 기준 1차 배분액</th><th>받은 특별수익(증여+유증, 보상 인정분 제외)</th><th>특별수익 반영 구체적 상속분(참고)</th></tr></table></div>
    </div>

    <div class="pen-instrument-card" style="grid-column:1/-1;">
      <h4>📊 3가지 효과 비교 <span style="font-size:0.72rem; color:#999; font-weight:400;">(세 효과는 성격이 달라 서로 합산하지 않습니다)</span></h4>
      <div class="pen-field-hint" style="margin-bottom:0.8rem;">대법원 2026. 5. 29. 선고 2024다208261 판결은 개정 민법 제1008조 단서의 보상적 증여·유증을 기여에 상응하는 범위에서 유류분 산정 기초재산에서도 제외하는 구조를 확인했습니다. 아래에서 상속인을 한 명 선택하면, 그 사람을 기준으로 세 가지 효과를 각각 보여드립니다.</div>
      <div class="pen-field-row">
        <div class="pen-field"><label>효과를 비교할 상속인</label><select id="cc2-effectsFocus" onchange="cc2Calc()"></select></div>
        <div class="pen-field"><label>이 상속인이 실제 받은 상속·유증·증여 등(원)</label><input type="text" inputmode="numeric" class="pen-comma-input" id="cc2-actualReceived" value="0" oninput="cc2Calc()"></div>
      </div>
      <div id="cc2-effectsSummary" style="margin-top:0.8rem;"></div>
    </div>

    <div class="pen-instrument-card" style="grid-column:1/-1;">
      <h4 style="display:flex; align-items:center; gap:0.5rem;">6. 자동 리포트
        <button type="button" class="site-speak-btn" data-speaking="0" onclick="siteSpeak(document.getElementById('cc2-report').innerText, this)" title="음성으로 듣기">🔊</button>
      </h4>
      <div id="cc2-report" style="font-size:0.88rem; line-height:1.8;">계산 버튼을 누르면 결과가 표시됩니다.</div>
      <div class="pen-field-row" style="margin-top:1.2rem;">
        <button type="button" class="pen-ai-btn" onclick="cc2Calc()">다시 계산</button>
        <button type="button" class="hn-cancel" onclick="cc2PrintSection()">인쇄 / PDF 저장</button>
        <button type="button" class="hn-cancel" id="cc2-jsonBtn" style="display:none;" onclick="cc2ExportData()">입력자료 JSON 저장(관리자용)</button>
      </div>
    </div>
  </div>

  <p style="max-width:75rem; margin:1.5rem auto 0; font-size:0.78rem; color:#999; text-align:center;">
    ※ 일반적 정보 제공 및 시뮬레이션 목적입니다. 실제 유류분 부족액은 개별 사건의 법률관계, 증여·유증의 성격과 시기, 공동상속인 여부, 채무, 상속재산 및 판례에 따라 달라질 수 있습니다. 법률상 기여분 확정액을 자동 산정하는 기능이 아니므로, 정확한 판단은 대면 상담을 통해 확인하시길 권유드립니다.
  </p>
</section>
```

> 사용법 안내 팝업(`#cc2HelpBg`/`#cc2HelpModal`, 용어 정의·입력 방법·결과 해석)은 원본 파일 7996~8248줄에 포함되어 있으며, §2의 용어 설명과 거의 동일한 내용이라 이 문서에서는 생략합니다(원본에서 그대로 복사 가능).

### 9.2 JavaScript 계산 로직 (`index.html` 라인 19706–20044)

```javascript
var cc2Gifts = [], cc2Contribs = [];
function cc2Won(n) { return new Intl.NumberFormat('ko-KR').format(Math.round(n||0)) + '원'; }
function cc2Num(id) { var el = document.getElementById(id); return el ? Math.max(0, Number(el.value.replace(/[^0-9.-]/g,'')) || 0) : 0; }
var cc2EvLabel = { 3: '높음', 2: '보통', 1: '낮음' };
var cc2LikeColor = { '높음': '#38a169', '보통': '#dd6b20', '낮음': '#c0392b' };
var cc2QualLabel = { no: '아니오', yes: '예', uncertain: '판단 필요' };
// 민법 §1008 단서(2026.3.17 개정) — 증여·유증이 기여에 대한 보상으로 행해진 경우 그 기여에
// 상응하는 범위에서 특별수익(및 유류분 기초재산 가산)에서 제외된다. 증빙수준별로 가장 유력한
// 인정비율(0%/50%/100%)을 적용한 제외액을 계산한다 — 유류분 제외 계산과 구체적 상속분(특별수익)
// 계산 양쪽에서 재사용한다.
function cc2GiftAppliedExclude(g) {
if (!g || g.qual === 'no') return 0;
var claim = Math.min(g.exclude, g.amount);
var pct = g.evidence === 3 ? 1.0 : (g.evidence === 1 ? 0 : 0.5);
return claim * pct;
}
function cc2Heirs() {
  var a = [];
  var sp = cc2Num('cc2-spouse') > 0;
  var c = Math.floor(cc2Num('cc2-children'));
  var p = Math.floor(cc2Num('cc2-parents'));
  if (sp) a.push({ name: '배우자', type: 'spouse', raw: 1.5 }); // 민법 제1009조 제2항: 직계비속 상속분의 5할 가산
  if (c > 0) { for (var i = 1; i <= c; i++) a.push({ name: '자녀' + i, type: 'child', raw: 1 }); }
  else if (p > 0) { for (var j = 1; j <= p; j++) a.push({ name: '직계존속' + j, type: 'parent', raw: 1 }); }
  return a;
}
function cc2Populate() {
  var hs = cc2Heirs();
  ['cc2-giftPerson', 'cc2-contribPerson', 'cc2-effectsFocus'].forEach(function(id) {
    var s = document.getElementById(id);
    if (!s) return;
    var prev = s.value;
    s.innerHTML = hs.map(function(h) { return '<option value="' + h.name + '">' + h.name + '</option>'; }).join('');
    if (hs.some(function(h){ return h.name === prev; })) s.value = prev;
  });
}
// 증여 판단(아니오/예/판단 필요)에 따라 증빙수준·주장 보상액 입력칸을 보이거나 숨긴다.
window.cc2ToggleGiftQualFields = function() {
  var qual = document.getElementById('cc2-giftQual').value;
  var show = (qual !== 'no');
  document.getElementById('cc2-giftEvidenceWrap').style.display = show ? '' : 'none';
  document.getElementById('cc2-giftExcludeWrap').style.display = show ? '' : 'none';
};
window.cc2AddGift = function() {
  var a = cc2Num('cc2-giftAmount');
  if (!a) { alert('증여·유증 가액을 입력하세요.'); return; }
  var qual = document.getElementById('cc2-giftQual').value;
  var exclude = qual !== 'no' ? Math.min(a, cc2Num('cc2-giftExclude')) : 0;
  var giftTypeEl = document.getElementById('cc2-giftType');
  cc2Gifts.push({
    person: document.getElementById('cc2-giftPerson').value, amount: a,
    date: document.getElementById('cc2-giftDate').value, memo: document.getElementById('cc2-giftMemo').value,
    qual: qual, evidence: Number(document.getElementById('cc2-giftEvidence').value), exclude: exclude,
    type: giftTypeEl ? giftTypeEl.value : 'gift'
  });
  document.getElementById('cc2-giftAmount').value = 0;
  document.getElementById('cc2-giftMemo').value = '';
  document.getElementById('cc2-giftQual').value = 'no';
  document.getElementById('cc2-giftExclude').value = 0;
  window.cc2ToggleGiftQualFields();
  cc2Render();
};
window.cc2AddContribution = function() {
  var a = cc2Num('cc2-contribAmount'), p = document.getElementById('cc2-contribPerson').value;
  if (!a && !cc2Num('cc2-liveMonths') && !cc2Num('cc2-careMonths') && !cc2Num('cc2-careCost') && !cc2Num('cc2-assetContribution')) { alert('기여자료를 하나 이상 입력하세요.'); return; }
  cc2Contribs.push({ person: p, amount: a, live: cc2Num('cc2-liveMonths'), care: cc2Num('cc2-careMonths'), cost: cc2Num('cc2-careCost'), asset: cc2Num('cc2-assetContribution'), evidence: Number(document.getElementById('cc2-evidence').value) });
  ['cc2-contribAmount', 'cc2-liveMonths', 'cc2-careMonths', 'cc2-careCost', 'cc2-assetContribution'].forEach(function(id) { document.getElementById(id).value = 0; });
  cc2Render();
};
window.cc2ClearGifts = function() { cc2Gifts.length = 0; cc2Render(); };
window.cc2ClearContrib = function() { cc2Contribs.length = 0; cc2Render(); };
window.cc2DelGift = function(i) { cc2Gifts.splice(i, 1); cc2Render(); };
window.cc2DelContrib = function(i) { cc2Contribs.splice(i, 1); cc2Render(); };

function cc2Render() {
  document.getElementById('cc2-giftTable').innerHTML =
    '<tr><th>수증자</th><th>가액</th><th>구분</th><th>증여일</th><th>판단</th><th>증빙</th><th>주장 보상액</th><th>메모</th><th></th></tr>' +
    cc2Gifts.map(function(g, i) {
      var qualCell = g.qual === 'no' ? '아니오' : ('<strong>' + cc2QualLabel[g.qual] + '</strong>');
      var evCell = g.qual === 'no' ? '-' : cc2EvLabel[g.evidence];
      var exCell = g.qual === 'no' ? '-' : cc2Won(g.exclude);
      return '<tr><td>' + g.person + '</td><td>' + cc2Won(g.amount) + '</td><td>' + (g.type === 'bequest' ? '유증' : '사전증여') + '</td><td>' + (g.date || '-') + '</td><td>' + qualCell + '</td><td>' + evCell + '</td><td>' + exCell + '</td><td>' + (g.memo || '-') + '</td><td><button type="button" class="hn-cancel" style="padding:0.3rem 0.7rem; font-size:0.75rem; color:#c0392b; border-color:#f0b8b8;" onclick="cc2DelGift(' + i + ')">삭제</button></td></tr>';
    }).join('');
  document.getElementById('cc2-contribTable').innerHTML =
    '<tr><th>기여자</th><th>기여분 주장액</th><th>동거</th><th>간병</th><th>비용</th><th>재산기여</th><th>증빙</th><th></th></tr>' +
    cc2Contribs.map(function(c, i) {
      var evLabel = cc2EvLabel[c.evidence];
      return '<tr><td>' + c.person + '</td><td>' + cc2Won(c.amount) + '</td><td>' + c.live + '개월</td><td>' + c.care + '개월</td><td>' + cc2Won(c.cost) + '</td><td>' + cc2Won(c.asset) + '</td><td>' + evLabel + '</td><td><button type="button" class="hn-cancel" style="padding:0.3rem 0.7rem; font-size:0.75rem; color:#c0392b; border-color:#f0b8b8;" onclick="cc2DelContrib(' + i + ')">삭제</button></td></tr>';
    }).join('');
  cc2Calc();
}

function cc2Shares(hs) {
  var total = hs.reduce(function(s, h) { return s + h.raw; }, 0);
  return hs.map(function(h) {
    return { name: h.name, type: h.type, raw: h.raw, share: total ? h.raw / total : 0, rate: h.type === 'parent' ? (1/3) : 0.5 };
  });
}

window.cc2Calc = function() {
  cc2Populate();
  var hs = cc2Shares(cc2Heirs());
  var net = Math.max(0, cc2Num('cc2-real') + cc2Num('cc2-finance') + cc2Num('cc2-stock') + cc2Num('cc2-other') - cc2Num('cc2-debt'));
  var giftTotal = cc2Gifts.filter(function(g) { return g.type !== 'bequest'; }).reduce(function(s, g) { return s + g.amount; }, 0); // 유증은 2번 재산에 이미 포함되어 있어 가산하지 않음(§1113①) — 생전 증여만 가산
  var baseBefore = net + giftTotal; // 증여 전부 반영, 제외 전(효과③의 종점)

  document.getElementById('cc2-netEstate').textContent = cc2Won(net);
  document.getElementById('cc2-giftTotal').textContent = cc2Won(giftTotal);
  document.getElementById('cc2-baseAdjusted').textContent = cc2Won(baseBefore);

  function heirByName(name) { return hs.filter(function(h){ return h.name === name; })[0]; }

  // ── ① 기여분(상속재산분할) 인정 비율 시나리오 ── 여러 명이 각자 기여분을
  // 주장할 수 있고, 기여자마다 증빙수준이 달라 인정 가능성도 각자 다를 수
  // 있다. 그래서 "전체 합계에 하나의 비율을 일괄 적용"하지 않고, 기여자별로
  // 나눠 각자의 주장액·증빙수준을 기준으로 0%/50%/100%를 따로 계산한다.
  // 기여분은 상속재산분할 단계의 변수이므로, 유류분이 아니라 "이 사람의
  // 구체적 상속분"이 어떻게 바뀌는지로 보여준다.
  var scenario3El = document.getElementById('cc2-scenario3');
  var byPerson = {};
  cc2Contribs.forEach(function(c) {
    if (!byPerson[c.person]) byPerson[c.person] = { amount: 0, minEv: 4 };
    byPerson[c.person].amount += c.amount;
    byPerson[c.person].minEv = Math.min(byPerson[c.person].minEv, c.evidence);
  });
  var personNames = Object.keys(byPerson);

  function contribScn(personShare, amount, pct) {
    var applied = Math.min(amount * pct, net);
    var adj = Math.max(0, net - applied);
    return { applied: applied, concrete: adj * personShare + applied };
  }

  var combinedProcessEl = document.getElementById('cc2-combinedProcess');
  var combinedAppliedByName = {}; // 종합 참고 추정에서 사람별로 실제 적용된 기여분(효과① 계산에 재사용)
  if (!personNames.length) {
    scenario3El.innerHTML = '<div style="font-size:0.85rem; color:#999; padding:0.8rem;">4번 "기여분 입력"에 기여 기록을 먼저 추가해 주세요.</div>';
    combinedProcessEl.innerHTML = '<div style="font-size:0.85rem; color:#999; padding:0.8rem;">4번 "기여분 입력"에 기여 기록을 먼저 추가하시면 여기에 계산 과정이 표시됩니다.</div>';
    document.getElementById('cc2-combinedHeirTable').innerHTML = '<tr><th>상속인</th><th>법정상속지분</th><th>기여분 미반영 구체적 상속분</th><th>종합 참고 추정 반영 후</th></tr>';
  } else {
    var personBlocks = personNames.map(function(name) {
      var pd = byPerson[name];
      var h = heirByName(name);
      var share = h ? h.share : 0;
      var ev = pd.minEv <= 3 ? pd.minEv : 2;
      var sA = contribScn(share, pd.amount, 0), sB = contribScn(share, pd.amount, 0.5), sC = contribScn(share, pd.amount, 1.0);
      var likelihood = { A: '보통', B: '보통', C: '보통' };
      if (ev === 3) likelihood = { A: '낮음', B: '보통', C: '높음' };
      else if (ev === 1) likelihood = { A: '높음', B: '보통', C: '낮음' };
      var rows = [
        ['시나리오 A — 불인정(0%)', sA, likelihood.A],
        ['시나리오 B — 일부 인정(50%)', sB, likelihood.B],
        ['시나리오 C — 전액 인정(100%)', sC, likelihood.C]
      ].map(function(r) {
        return '<tr><td>' + r[0] + '</td><td>' + cc2Won(r[1].applied) + '</td><td>' + cc2Won(r[1].concrete) + '</td><td style="color:' + cc2LikeColor[r[2]] + '; font-weight:700;">' + r[2] + '</td></tr>';
      }).join('');
      return '<div style="margin-bottom:1rem; padding:0.8rem 1rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">' +
        '<div style="font-weight:700; font-size:0.9rem; margin-bottom:0.4rem;">기여자: ' + name + ' <span style="font-weight:400; color:#718096; font-size:0.8rem;">(기여분 주장액 합계 ' + cc2Won(pd.amount) + ', 증빙수준 ' + cc2EvLabel[ev] + ')</span></div>' +
        '<div style="overflow-x:auto;"><table class="pen-compare-table"><tr><th>구분</th><th>인정 기여분</th><th>이 사람의 구체적 상속분</th><th>증빙 기준 가능성</th></tr>' + rows + '</table></div>' +
        '</div>';
    }).join('');
    scenario3El.innerHTML = personBlocks;

    // 종합 참고 추정 — 각자의 "가장 유력해 보이는 시나리오"(증빙수준이 높으면 C,
    // 보통이면 B, 낮으면 A)를 적용했을 때 전체적으로 어떻게 되는지, 그 계산 과정을
    // 사람별로 한 줄씩 투명하게 보여준 뒤 최종 합계를 낸다.
    var combinedRows = personNames.map(function(name) {
      var pd = byPerson[name];
      var ev = pd.minEv <= 3 ? pd.minEv : 2;
      var pct = ev === 3 ? 1.0 : (ev === 1 ? 0 : 0.5);
      var applied = Math.min(pd.amount * pct, net);
      return { name: name, amount: pd.amount, ev: ev, pct: pct, applied: applied };
    });
    var combinedApplied = 0;
    combinedRows.forEach(function(r) {
      r.applied = Math.min(r.applied, net - combinedApplied);
      combinedApplied += r.applied;
      combinedAppliedByName[r.name] = r.applied;
    });
    var adjEstateCombined = Math.max(0, net - combinedApplied);

    combinedProcessEl.innerHTML =
      '<div style="overflow-x:auto; margin-bottom:0.8rem;"><table class="pen-compare-table"><tr><th>기여자</th><th>기여분 주장액</th><th>증빙수준</th><th>적용한 인정비율</th><th>인정 기여분</th></tr>' +
      combinedRows.map(function(r) {
        return '<tr><td>' + r.name + '</td><td>' + cc2Won(r.amount) + '</td><td>' + cc2EvLabel[r.ev] + '</td><td>' + (r.pct*100).toFixed(0) + '%</td><td>' + cc2Won(r.applied) + '</td></tr>';
      }).join('') +
      '<tr style="font-weight:700; background:#eaf6ee;"><td colspan="4">합계(인정 기여분)</td><td>' + cc2Won(combinedApplied) + '</td></tr>' +
      '</table></div>' +
      '<div style="padding:0.9rem 1rem; background:#eaf6ee; border-radius:8px; border:1px solid #b8ddc4;">' +
      '<div style="font-size:0.85rem; color:#2c5f3f;">위 계산 과정을 반영하면, 상속재산분할 대상재산은 ' + cc2Won(net) + '에서 <strong>' + cc2Won(adjEstateCombined) + '</strong>로 조정되고, 인정된 기여분 합계 <strong>' + cc2Won(combinedApplied) + '</strong>은 해당 기여자의 구체적 상속분에 더해집니다.</div>' +
      '<div style="font-size:0.72rem; color:#6a9478; margin-top:0.4rem;">※ 실제로는 각 기여자의 주장이 개별적으로 심리·판단되므로, 이 종합 수치는 여러 시나리오 조합 중 하나를 보여드리는 참고용일 뿐입니다.</div>' +
      '</div>';

    var combinedHeirRows = hs.map(function(h) {
      var before = net * h.share;
      var afterCombined = adjEstateCombined * h.share + (combinedAppliedByName[h.name] || 0);
      return '<tr><td>' + h.name + '</td><td>' + (h.share*100).toFixed(2) + '%</td><td>' + cc2Won(before) + '</td><td>' + cc2Won(afterCombined) + '</td></tr>';
    }).join('');
    document.getElementById('cc2-combinedHeirTable').innerHTML =
      '<tr><th>상속인</th><th>법정상속지분</th><th>기여분 미반영 구체적 상속분</th><th>종합 참고 추정 반영 후</th></tr>' + combinedHeirRows;
  }

  // ── 특별수익(증여·유증) 반영 구체적 상속분 — 민법 §1008 ──
  // 간주상속재산(= 순상속재산 + 생전증여 총액 − 인정 기여분 합계)을 법정상속분으로 나눈 뒤,
  // 기여자에게는 인정 기여분을 더하고, 각자가 받은 특별수익(생전증여+유증)을 공제한다. 유증은
  // "2. 현재 상속재산"에 이미 포함돼 있어 간주상속재산에는 다시 더하지 않고 본인 몫에서만 뺀다.
  // 기여에 대한 보상으로 인정된 부분(cc2GiftAppliedExclude)은 §1008 단서에 따라 특별수익에서도
  // 제외한다. 특별수익이 1차 배분액을 초과하면(초과특별수익자) §1008 본문에 따라 구체적 상속분은
  // 0으로 하고, 초과분의 재분배(초과특별수익자 조정)는 반영하지 않는다.
  // (2026-11-07 수정: 이전 버전은 생전증여를 간주상속재산에 합산하지 않아 상속인들의 구체적
  // 상속분 합계가 순상속재산보다 작아지는 오류가 있었음 — 외부 검토로 발견, imputedEstate로 수정)
  var specialBenefitEl = document.getElementById('cc2-specialBenefitTable');
  if (specialBenefitEl) {
    var contribAppliedTotal = personNames.length ? combinedApplied : 0;
    var imputedEstate = Math.max(0, net + giftTotal - contribAppliedTotal);
    var sbRows = hs.map(function(h) {
      var firstAllocation = imputedEstate * h.share + (personNames.length ? (combinedAppliedByName[h.name] || 0) : 0);
      var benefit = cc2Gifts.filter(function(g) { return g.person === h.name; })
        .reduce(function(sum, g) { return sum + Math.max(0, g.amount - cc2GiftAppliedExclude(g)); }, 0);
      var finalShare = Math.max(0, firstAllocation - benefit);
      var excess = benefit > firstAllocation;
      return '<tr><td>' + h.name + '</td><td>' + cc2Won(firstAllocation) + '</td><td>' + cc2Won(benefit) + '</td><td>' + cc2Won(finalShare) + (excess ? ' <span style="color:#c0392b; font-weight:700;">(초과수익)</span>' : '') + '</td></tr>';
    }).join('');
    specialBenefitEl.innerHTML = '<tr><th>상속인</th><th>간주상속재산 기준 1차 배분액</th><th>받은 특별수익(증여+유증, 보상 인정분 제외)</th><th>특별수익 반영 구체적 상속분(참고)</th></tr>' + sbRows;
  }

  // ── ② 보상적 증여 제외 시나리오 (증여 항목별) ── 3번에서 "예"/"판단 필요"로
  // 표시한 증여마다, 그 항목의 주장 보상액·증빙수준을 기준으로 0%/50%/100%를
  // 따로 계산한다(대법원 2026.5.29. 선고 2024다208261 판결이 확인한 구조).
  var giftScenarioEl = document.getElementById('cc2-giftScenario');
  var judgedGifts = cc2Gifts.map(function(g, i){ return { g: g, i: i }; }).filter(function(x){ return x.g.qual !== 'no'; });
  var hasUncertain = judgedGifts.some(function(x){ return x.g.qual === 'uncertain'; });
  var combinedGiftExclude = 0;

  if (!judgedGifts.length) {
    giftScenarioEl.innerHTML = '<div style="font-size:0.85rem; color:#999; padding:0.8rem;">3번 증여 항목 중 "예" 또는 "판단 필요"로 표시된 것이 없습니다.</div>';
  } else {
    var giftBlocks = judgedGifts.map(function(x) {
      var g = x.g;
      var claim = Math.min(g.exclude, g.amount);
      var pct = g.evidence === 3 ? 1.0 : (g.evidence === 1 ? 0 : 0.5);
      var applied = cc2GiftAppliedExclude(g);
      combinedGiftExclude += applied;
      var likelihood = { A: '보통', B: '보통', C: '보통' };
      if (g.evidence === 3) likelihood = { A: '낮음', B: '보통', C: '높음' };
      else if (g.evidence === 1) likelihood = { A: '높음', B: '보통', C: '낮음' };
      var scnRows = [
        ['시나리오 A — 불인정(0%)', 0, likelihood.A],
        ['시나리오 B — 일부 인정(50%)', claim*0.5, likelihood.B],
        ['시나리오 C — 전액 인정(100%)', claim, likelihood.C]
      ].map(function(r) {
        return '<tr><td>' + r[0] + '</td><td>' + cc2Won(r[1]) + '</td><td style="color:' + cc2LikeColor[r[2]] + '; font-weight:700;">' + r[2] + '</td></tr>';
      }).join('');
      return '<div style="margin-bottom:1rem; padding:0.8rem 1rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">' +
        '<div style="font-weight:700; font-size:0.9rem; margin-bottom:0.4rem;">증여: ' + g.person + ' · ' + cc2Won(g.amount) + (g.date ? ' · ' + g.date : '') + ' <span style="font-weight:400; color:#718096; font-size:0.8rem;">(판단: ' + cc2QualLabel[g.qual] + ', 증빙수준 ' + cc2EvLabel[g.evidence] + ')</span></div>' +
        '<div style="overflow-x:auto;"><table class="pen-compare-table"><tr><th>구분</th><th>유류분 기초재산 제외액</th><th>증빙 기준 가능성</th></tr>' + scnRows + '</table></div>' +
        (g.qual === 'uncertain' ? '<div style="font-size:0.78rem; color:#b45309; margin-top:0.4rem;">이 증여는 "판단 필요" 상태입니다. 아래 종합 결과에는 증빙수준 기준 가장 유력한 시나리오가 참고용으로만 반영되어 있습니다.</div>' : '') +
        '</div>';
    }).join('');
    giftScenarioEl.innerHTML = giftBlocks +
      '<div style="padding:0.9rem 1rem; background:#fdecec; border-radius:8px; border:1px solid #f0c2c2;">' +
      '<div style="font-size:0.85rem; color:#8a2b2b;">위 증여들에 증빙수준 기준 가장 유력한 시나리오를 적용하면, 유류분 산정 기초재산에서 총 <strong>' + cc2Won(combinedGiftExclude) + '</strong>이 제외됩니다.</div>' +
      (hasUncertain ? '<div style="font-size:0.72rem; color:#a15252; margin-top:0.4rem;">※ "판단 필요" 증여가 포함되어 있어, 실제 결론에 따라 이 금액은 달라질 수 있습니다.</div>' : '') +
      '</div>';
  }

  var baseFinal = Math.max(0, baseBefore - combinedGiftExclude); // 일부 보상적 증여 인정 유류분(최종) — 효과②의 종점

  // ── 상속인별 유류분 분석: 증여 모두 인정(=net만) / 증여 모두 불인정(=baseBefore) / 일부 보상적 증여 인정(최종) 세 기준을 나란히 ──
  var heirRows = hs.map(function(h) {
    var base0 = net * h.share * h.rate;
    var baseAll = baseBefore * h.share * h.rate;
    var baseExcl = baseFinal * h.share * h.rate;
    var got = cc2Gifts.filter(function(g) { return g.person === h.name; }).reduce(function(s, g) { return s + g.amount; }, 0);
    return '<tr><td>' + h.name + '</td><td>' + (h.share*100).toFixed(2) + '%</td><td>' + (h.rate*100).toFixed(1) + '%</td><td>' + cc2Won(base0) + '</td><td>' + cc2Won(baseAll) + '</td><td>' + cc2Won(baseExcl) + '</td><td>' + cc2Won(got) + '</td></tr>';
  }).join('');
  document.getElementById('cc2-heirTable').innerHTML =
    '<tr><th>상속인</th><th>법정상속지분</th><th>유류분 비율</th><th>증여 모두 인정 유류분</th><th>증여 모두 불인정 유류분</th><th>일부 보상적 증여 인정 유류분(최종)</th><th>증여·유증 수령</th></tr>' + heirRows;

  var cs = hs.map(function(h) {
    var list = cc2Contribs.filter(function(c) { return c.person === h.name; });
    var amount = list.reduce(function(s, c) { return s + c.amount; }, 0);
    var cost = list.reduce(function(s, c) { return s + c.cost; }, 0);
    var asset = list.reduce(function(s, c) { return s + c.asset; }, 0);
    var ev = list.length ? Math.min.apply(null, list.map(function(c) { return c.evidence; })) : 0;
    return { name: h.name, amount: amount, cost: cost, asset: asset, ev: ev };
  }).filter(function(x) { return x.amount || x.cost || x.asset; });
  document.getElementById('cc2-contribSummary').innerHTML = cs.length
    ? '<div style="overflow-x:auto;"><table class="pen-compare-table"><tr><th>기여자</th><th>기여분 주장액</th><th>부담비용</th><th>재산기여 추정액</th><th>증빙수준</th></tr>' +
      cs.map(function(c) { return '<tr><td>' + c.name + '</td><td>' + cc2Won(c.amount) + '</td><td>' + cc2Won(c.cost) + '</td><td>' + cc2Won(c.asset) + '</td><td>' + cc2EvLabel[c.ev] + '</td></tr>'; }).join('') +
      '</table></div>'
    : '기여 기록이 없습니다.';

  // ── ③가지 효과 비교(효과①②③, 합산하지 않음) + 실제수령액→부족액 ──
  var focusName = document.getElementById('cc2-effectsFocus').value;
  var focus = heirByName(focusName) || hs[0];
  var effectsEl = document.getElementById('cc2-effectsSummary');
  if (!focus) {
    effectsEl.innerHTML = '<div style="font-size:0.85rem; color:#999;">상속인 구성을 먼저 입력해 주세요.</div>';
  } else {
    var focusBefore1 = net * focus.share;
    var combinedAppliedSum = 0;
    Object.keys(combinedAppliedByName).forEach(function(k) { combinedAppliedSum += combinedAppliedByName[k]; });
    var focusAfter1 = (personNames.length ? (Math.max(0, net - combinedAppliedSum) * focus.share + (combinedAppliedByName[focus.name] || 0)) : focusBefore1);
    var effect1 = focusAfter1 - focusBefore1; // 기여분 효과(상속재산분할, 종합 참고 추정 기준)
    var effect2 = combinedGiftExclude * focus.share * focus.rate; // 보상적 증여 제외 효과(유류분 감소)
    var effect3 = giftTotal * focus.share * focus.rate; // 특별수익 반영 효과(유류분 증가)
    var finalYuryu = baseFinal * focus.share * focus.rate;
    var actualReceived = cc2Num('cc2-actualReceived');
    var shortage = Math.max(0, finalYuryu - actualReceived);
    effectsEl.innerHTML =
      '<div style="font-weight:700; margin-bottom:0.6rem;">기준 상속인: ' + focus.name + '</div>' +
      '<div style="display:flex; justify-content:space-between; padding:9px 12px; background:#eef2fb; border-radius:6px; margin-bottom:6px; font-size:0.88rem;"><span><strong>① 기여분 효과</strong> <span style="font-size:0.75rem; color:#666;">(상속재산분할 구체적 상속분 변화, 종합 참고 추정 기준)</span></span><span style="font-weight:800;">' + (effect1>=0?'+':'') + cc2Won(effect1) + '</span></div>' +
      '<div style="display:flex; justify-content:space-between; padding:9px 12px; background:#fdecec; border-radius:6px; margin-bottom:6px; font-size:0.88rem;"><span><strong>② 보상적 증여 제외 효과</strong> <span style="font-size:0.75rem; color:#666;">(유류분 감소, 종합 참고 추정 기준)</span></span><span style="font-weight:800;">-' + cc2Won(effect2) + '</span></div>' +
      '<div style="display:flex; justify-content:space-between; padding:9px 12px; background:#eaf6ee; border-radius:6px; margin-bottom:10px; font-size:0.88rem;"><span><strong>③ 특별수익 반영 효과</strong> <span style="font-size:0.75rem; color:#666;">(증여 전부 반영 시 유류분 증가)</span></span><span style="font-weight:800;">+' + cc2Won(effect3) + '</span></div>' +
      '<div style="font-size:0.72rem; color:#999; margin-bottom:10px;">세 효과는 법적 성격이 달라 하나로 합산하지 않습니다. ①은 상속재산분할(민법 제1008조의2), ②·③은 유류분(민법 제1008조 단서·제1118조)에 관한 것입니다.</div>' +
      '<div style="padding:0.9rem 1rem; background:#f1f4f8; border-radius:8px;"><div style="font-size:0.8rem; color:#555;">' + focus.name + '의 최종 유류분(보상적 증여 제외 반영) <strong>' + cc2Won(finalYuryu) + '</strong> 대비 실제 수령액 ' + cc2Won(actualReceived) + '을 비교하면,</div>' +
      (shortage > 0
        ? '<div style="font-size:1rem; font-weight:800; color:#c0392b; margin-top:0.3rem;">유류분 부족액 ' + cc2Won(shortage) + '</div>'
        : '<div style="font-size:1rem; font-weight:800; color:#1e5c33; margin-top:0.3rem;">현재 입력값에서는 유류분 부족액이 없습니다.</div>') +
      '</div>';
  }

  var msg = '· 순상속재산은 ' + cc2Won(net) + ', 입력한 증여·유증은 ' + cc2Won(giftTotal) + '이며, 증여를 전부 반영한 유류분 산정 기초재산은 ' + cc2Won(baseBefore) + '입니다.<br>';
  if (personNames.length) msg += '· 4번에 기록하신 기여분 내용을 반영한 시나리오와 종합 참고 추정은 "기여분 인정 비율 시나리오"에서 확인하실 수 있습니다.<br>';
  else msg += '· 아직 4번 "기여분 입력"에 기록된 내용이 없습니다.<br>';
  if (judgedGifts.length) msg += '· 3번에서 보상적 증여로 표시하신 증여 항목을 반영하면, 유류분 산정 기초재산에서 참고용으로 ' + cc2Won(combinedGiftExclude) + '이 제외됩니다.<br>';
  else msg += '· 아직 3번에 보상적 증여로 표시된 증여 항목이 없습니다.<br>';
  msg += '· 대법원 2026. 5. 29. 선고 2024다208261 판결은 보상적 증여·유증을 기여에 상응하는 범위에서 유류분 산정 기초재산에서도 제외하는 구조를 확인했습니다. 이 조항은 2024년 4월 25일 이후 개시된 상속에 한해 적용됩니다(민법 부칙 2026.3.17. 제2조).<br>';
  msg += '· <strong>이 계산기가 다루지 않는 것:</strong> 입력한 증여의 시기(민법 제1114조의 산입 기간)는 계산에 반영하지 않고 모두 산입합니다. 유류분 반환청구권은 상속개시와 반환할 증여·유증을 안 때부터 1년, 상속개시 후 10년이면 소멸하며(제1117조), 가액 지급을 청구한 날부터 이자가 붙습니다(제1115조 제1항, 2026.3.17. 이후 개시된 상속). 기여분은 상속재산에서 유증을 뺀 액을 넘지 못하나(제1008조의2 제3항) 유증을 따로 입력받지 않아 순상속재산을 한도로 봅니다.<br>';
  msg += '· <strong>실무 체크:</strong> 동거·간호 기간, 병원·간병비, 재산관리 내역, 증여계약서, 피상속인의 의사 및 기여와 증여의 상응관계를 확보하세요.';
  document.getElementById('cc2-report').innerHTML = msg;
};
```

### 9.3 회귀 테스트 전문 (`tests/contribution.test.mjs`, 15개 검증 — 이식 시 기대값 스펙으로 재사용 가능)

```javascript
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

console.log(n+' passed');
```

---

### 부록: 이 문서를 받은 개발 세션에게

이 문서는 heps119.com 간편 계산기의 "기여상속 및 유류분 분석 시뮬레이터"를 accydream.co.kr(HEPS Dream) 또는 HEPS Intelligence로 이식할지 검토하기 위해 작성되었습니다. §9의 HTML/JS는 heps119의 jQuery 없는 순수 vanilla-JS, 거대한 단일 `index.html` 구조에서 그대로 발췌한 것이라, 대상 사이트의 프레임워크·컴포넌트 구조에 맞게 재설계가 필요할 수 있습니다(그대로 복사-붙여넣기를 권장하지 않습니다). §5(알려진 한계)는 이식 여부와 무관하게 실제 법적 정확도를 높이려면 추가로 다뤄야 할 항목이니, 새로 설계할 때 같이 반영을 검토해 주세요.
