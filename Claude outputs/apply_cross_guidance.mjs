import fs from 'node:fs';

const path = process.argv[2];
let s = fs.readFileSync(path, 'utf8');

function must(old, label) {
  const n = s.split(old).length - 1;
  if (n !== 1) throw new Error(`"${label}" matched ${n} times (expected 1)`);
}
function apply(old, neu, label) {
  must(old, label);
  s = s.replace(old, neu);
}

// 1) 상속세 간이계산기 쪽: "산출세액" 분할납부 안내문 끝에, 실제 분할비율이 법정상속분과
// 달라지는 경우(기여분·유류분 등) 참고할 도구로 기여상속·유류분 시뮬레이터를 안내.
apply(
`<p style="font-size:0.68rem;color:rgba(255,255,255,0.75);margin:-0.3rem 0 0.4rem;font-family:'Noto Sans KR',sans-serif;">※ 이 "산출세액"(기납부 증여세액공제 <strong>차감 전</strong> 금액)이 상속인간 분할납부액을 계산하는 기준 금액입니다. 각 상속인이 실제 상속받은 재산의 비율대로 이 금액을 나눈 뒤, 신고세액공제는 비율대로 배분하고, 기납부 증여세액공제는 실제 그 증여를 받았던 상속인의 몫에서만 차감합니다 — 기납부 증여세액공제는 그 증여를 받은 사람에게만 귀속되는 개별 credit이므로, 분할 기준 자체에서 미리 빼면 다른 상속인에게 혜택이 잘못 분산됩니다.</p>`,
`<p style="font-size:0.68rem;color:rgba(255,255,255,0.75);margin:-0.3rem 0 0.4rem;font-family:'Noto Sans KR',sans-serif;">※ 이 "산출세액"(기납부 증여세액공제 <strong>차감 전</strong> 금액)이 상속인간 분할납부액을 계산하는 기준 금액입니다. 각 상속인이 실제 상속받은 재산의 비율대로 이 금액을 나눈 뒤, 신고세액공제는 비율대로 배분하고, 기납부 증여세액공제는 실제 그 증여를 받았던 상속인의 몫에서만 차감합니다 — 기납부 증여세액공제는 그 증여를 받은 사람에게만 귀속되는 개별 credit이므로, 분할 기준 자체에서 미리 빼면 다른 상속인에게 혜택이 잘못 분산됩니다. 이 "실제 상속받은 재산의 비율"이 법정상속분과 달라질 수 있는 대표적인 경우가 기여분(민법 §1008조의2)과 유류분(§1112 이하) 관련 분쟁입니다 — 그 비율을 참고용으로 추정해 보려면 아래 <a href="#contribution-calc" style="color:var(--gold2); text-decoration:underline;">기여상속 및 유류분 분석 시뮬레이터</a>를 이용하실 수 있습니다. 다만 이 계산기는 이 시뮬레이터와 서로 연동되지 않으며, 세액은 항상 이 계산기에서, 분할비율 참고는 그 시뮬레이터에서 각각 확인해야 합니다.</p>`,
"상속세 계산기 → 기여상속·유류분 시뮬레이터 안내 추가"
);

// 2) 기여상속·유류분 시뮬레이터 쪽: 이 도구의 역할(민법상 분할비율 시뮬레이션)과 한계(상속세
// 자체는 계산하지 않음)를 섹션 도입부 문단에 구체적으로 명시.
apply(
`<p style="color:#2e2e2e; font-size:0.92rem; line-height:1.8; font-family:'Noto Sans KR',sans-serif;">
      특별한 부양·재산 유지·증가 기여와 보상적 증여·유증이 유류분에 미치는 영향을 시뮬레이션합니다.
    </p>`,
`<p style="color:#2e2e2e; font-size:0.92rem; line-height:1.8; font-family:'Noto Sans KR',sans-serif;">
      특별한 부양·재산 유지·증가 기여와 보상적 증여·유증이 유류분에 미치는 영향을 시뮬레이션합니다. <strong>이 계산기의 역할은 상속재산을 상속인들 사이에 실제로 어떻게 나눌지(민법상 분할비율)를 가늠해 보는 것이며, 상속세 자체는 계산하지 않습니다.</strong> 총 상속세액은 위쪽 <a href="#inheritance-calculator" style="color:var(--navy); text-decoration:underline;">상속세 간이 계산기</a>에서 확인하시고, 상속세는 원칙적으로 각 상속인이 실제로 받은 재산의 비율대로 나뉘므로(상증법 §3조의2), 기여분·유류분 등으로 그 비율이 법정상속분과 달라질 수 있는 경우 이 시뮬레이터의 분할비율 추정 결과를 참고용으로 함께 보실 수 있습니다. 두 계산기는 서로 자동으로 연동되지 않습니다.
    </p>`,
"기여상속·유류분 시뮬레이터 → 상속세 계산기 역할 명시 추가"
);

fs.writeFileSync(path, s, 'utf8');
console.log('cross guidance applied OK, new length', s.length);
