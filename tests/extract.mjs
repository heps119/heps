// index.html(단일 파일)에서 계산 함수만 뽑아 노드에서 실행하기 위한 도우미.
// 사이트 코드를 바꾸지 않고 회귀 테스트를 걸기 위한 용도다.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function 함수추출(html, 이름) {
  const 시작 = html.search(new RegExp(`^function ${이름}\\(`, 'm'));
  if (시작 < 0) throw new Error(`함수를 찾지 못했습니다: ${이름}`);
  let i = html.indexOf('{', 시작), 깊이 = 0;
  for (; i < html.length; i++) {
    const c = html[i];
    if (c === '{') 깊이++;
    else if (c === '}' && --깊이 === 0) return html.slice(시작, i + 1);
  }
  throw new Error(`함수 끝을 찾지 못했습니다: ${이름}`);
}

// 상속세 계산기(calcInheritance)를 가짜 DOM 위에서 실행한다. 값은 화면 입력과 같이 "천원" 단위.
export function 상속세계산기(입력) {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const 결과 = {};
  const 기본 = { c_decedent_resident: '1', c_asset: '0', c_gift: '0', c_estimated: '0', c_funeral: '0', c_deposit: '0', c_debt: '0',
    c_spouse_alive: '0', c_spouse_amount: '0', c_children: '0', c_financial: '0', c_paid_tax: '0', c_business: '0', c_gift_deduct: '0' };
  const 값 = { ...기본, ...입력 };
  const el = (id) => ({ value: 값[id] ?? '', checked: false, style: {}, classList: { add() {}, remove() {} }, scrollIntoView() {},
    set textContent(v) { 결과[id] = v; }, get textContent() { return 결과[id]; } });
  const 코드 = ['parseNum', 'fmt', 'calcTax', 'getRateLabel', 'calcInheritance'].map((n) => 함수추출(html, n)).join('\n')
    + '\nvar INHERITANCE_TAX_FLOOR = 500000;\nthis.__run = calcInheritance;';
  const ctx = { document: { getElementById: (id) => (id.startsWith('r-') || id === 'calcResult' ? el(id) : (id in 값 || id.startsWith('c_') ? el(id) : null)) }, alert() {}, console, Math, parseInt, parseFloat, Number, String, isNaN };
  vm.createContext(ctx);
  vm.runInContext(코드, ctx);
  ctx.__run(false);
  return 결과;
}
