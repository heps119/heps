/*
 * heps119.com — 증여세·상속세 계산기 결과 PDF 출력 기능
 * jsPDF + jsPDF-AutoTable 기반, 100% 클라이언트(브라우저) 내부에서만 동작합니다.
 * 입력/계산 데이터는 서버로 전송되지 않으며, PDF도 사용자의 브라우저에서 직접 생성·다운로드됩니다.
 * 페이지를 떠나면 모든 데이터는 메모리에서 사라집니다 (별도 저장 로직 없음).
 */

(function () {

  // ─── 한글 폰트 등록 (Noto Sans KR subset) ───
  function registerKoreanFont(doc) {
    if (!window.__HEPS_PDF_FONT_REGULAR__ || !window.__HEPS_PDF_FONT_BOLD__) {
      console.error('PDF 한글 폰트 파일이 로드되지 않았습니다. notosanskr-pdf-font.js를 확인하세요.');
      return false;
    }
    doc.addFileToVFS('NotoSansKR-Regular.ttf', window.__HEPS_PDF_FONT_REGULAR__);
    doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
    doc.addFileToVFS('NotoSansKR-Bold.ttf', window.__HEPS_PDF_FONT_BOLD__);
    doc.addFont('NotoSansKR-Bold.ttf', 'NotoSansKR', 'bold');
    doc.setFont('NotoSansKR', 'normal');
    return true;
  }

  function txt(id) {
    var el = document.getElementById(id);
    return el ? (el.textContent || '').trim() : '';
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '').trim() : '';
  }

  function selectedLabel(id) {
    var el = document.getElementById(id);
    if (!el || el.selectedIndex < 0) return '';
    return el.options[el.selectedIndex].textContent.trim();
  }

  function todayStamp() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function todayFileStamp() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  }

  // 공통 문서 헤더
  function drawHeader(doc, title) {
    var pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('NotoSansKR', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(150, 130, 80);
    doc.text('HYEONGOK INHERITANCE TRUST DESIGN RESEARCH INSTITUTE', 40, 40);

    doc.setFontSize(18);
    doc.setTextColor(30, 35, 45);
    doc.text(title, 40, 64);

    doc.setFont('NotoSansKR', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('현곡상속신탁설계연구소  ·  heps119.com', 40, 82);
    doc.text('생성일시: ' + todayStamp(), pageWidth - 40, 82, { align: 'right' });

    doc.setDrawColor(200, 200, 200);
    doc.line(40, 92, pageWidth - 40, 92);

    return 108; // 다음 콘텐츠 시작 y좌표
  }

  // 공통 문서 푸터(면책 문구)
  function drawFooter(doc, disclaimer) {
    var pageCount = doc.internal.getNumberOfPages();
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    for (var i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('NotoSansKR', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      var lines = doc.splitTextToSize(disclaimer, pageWidth - 80);
      doc.text(lines, 40, pageHeight - 34);
      doc.text('본 문서는 상담 참고용으로만 사용해 주십시오. — ' + (i) + ' / ' + pageCount, pageWidth - 40, pageHeight - 16, { align: 'right' });
    }
  }

  function baseTableOptions(startY) {
    return {
      startY: startY,
      theme: 'grid',
      styles: {
        font: 'NotoSansKR',
        fontSize: 9.5,
        cellPadding: 6,
        textColor: [40, 40, 40],
        lineColor: [225, 225, 225],
        lineWidth: 0.5,
      },
      headStyles: {
        font: 'NotoSansKR',
        fontStyle: 'bold',
        fillColor: [30, 42, 58],
        textColor: [255, 255, 255],
        fontSize: 9.5,
      },
      alternateRowStyles: { fillColor: [248, 247, 243] },
      margin: { left: 40, right: 40 },
    };
  }

  // ───────────────────────────────────────────
  // 증여세 계산기 PDF 출력
  // ───────────────────────────────────────────
  window.exportGiftTaxPDF = function () {
    if (typeof calcGiftTax === 'function') calcGiftTax(); // 최신값으로 재계산

    if (typeof window.jspdf === 'undefined') {
      alert('PDF 라이브러리를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    if (!registerKoreanFont(doc)) { alert('PDF 폰트를 불러오지 못했습니다.'); return; }

    var y = drawHeader(doc, '증여세 간이 계산 결과');

    // ── 입력값 요약 ──
    doc.autoTable(Object.assign(baseTableOptions(y), {
      head: [['입력 항목', '내용']],
      body: [
        ['신규 증여재산가액', (val('g_new') || '0') + ' 천원'],
        ['차감할 부채', (val('g_debt') || '0') + ' 천원'],
        ['10년 이내 동일인 기존 증여가액', (val('g_prior') || '0') + ' 천원'],
        ['기존 증여 산출세액(기납부세액)', (val('g_priortax') || '0') + ' 천원'],
        ['수증자 구분', selectedLabel('g_relation')],
      ],
      columnStyles: { 0: { cellWidth: 220 } },
    }));

    var y2 = doc.lastAutoTable.finalY + 24;
    doc.setFont('NotoSansKR', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 35, 45);
    doc.text('계산 결과', 40, y2 - 8);

    var body = [
      ['신규 증여재산가액', txt('g-r-new')],
      ['(+) 10년 이내 기존 증여가액', txt('g-r-prior')],
      ['(−) 차감할 부채', txt('g-r-debt')],
      ['증여세 과세가액', txt('g-r-taxbase0')],
      ['증여재산공제', txt('g-r-deduct')],
      ['과세표준', txt('g-r-base')],
      ['적용 세율 구간', txt('g-r-rate')],
      ['산출세액 (할증 전)', txt('g-r-calculated')],
    ];
    var surtaxRow = document.getElementById('g-r-surtax-row');
    if (surtaxRow && surtaxRow.style.display !== 'none') {
      body.push(['(+) 세대생략 할증세액', txt('g-r-surtax')]);
      body.push(['할증 적용 후 산출세액', txt('g-r-aftersur')]);
    }
    body.push(['(−) 기납부세액공제', txt('g-r-paid')]);
    body.push(['(−) 신고세액공제 (3%)', txt('g-r-report')]);

    doc.autoTable(Object.assign(baseTableOptions(y2 + 4), {
      body: body,
      columnStyles: { 0: { cellWidth: 220 }, 1: { halign: 'right' } },
    }));

    var y3 = doc.lastAutoTable.finalY + 6;
    doc.autoTable({
      startY: y3,
      theme: 'plain',
      body: [['납부할 증여세 (추정)', txt('g-r-tax')]],
      styles: { font: 'NotoSansKR', fontStyle: 'bold', fontSize: 13, textColor: [150, 30, 30], cellPadding: 8 },
      columnStyles: { 0: { cellWidth: 220 }, 1: { halign: 'right' } },
      margin: { left: 40, right: 40 },
    });

    drawFooter(doc, '※ 본 결과는 엑셀 증여세 계산 로직(2025년 기준)에 세대생략 할증과세(상증법 제57조)를 추가 반영한 간이 추정치입니다. 창업자금·가업승계 특례 등은 포함되지 않았습니다. 정확한 납부세액은 현곡상속신탁설계연구소에 상담 신청해 주십시오.');

    doc.save('증여세_계산결과_' + todayFileStamp() + '.pdf');
  };

  // ───────────────────────────────────────────
  // 상속세 계산기 PDF 출력
  // ───────────────────────────────────────────
  window.exportInheritanceTaxPDF = function () {
    if (typeof calcInheritance === 'function') calcInheritance(); // 최신값으로 재계산

    var assetVal = val('c_asset');
    if (!assetVal || assetVal === '0') {
      alert('상속재산 가액을 입력하고 [상속세 추정 계산하기]를 먼저 실행해 주세요.');
      return;
    }

    if (typeof window.jspdf === 'undefined') {
      alert('PDF 라이브러리를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    if (!registerKoreanFont(doc)) { alert('PDF 폰트를 불러오지 못했습니다.'); return; }

    var y = drawHeader(doc, '상속세 간이 계산 결과');

    // ── 입력값 요약 ──
    doc.autoTable(Object.assign(baseTableOptions(y), {
      head: [['입력 항목', '내용']],
      body: [
        ['상속재산 합계', (val('c_asset') || '0') + ' 천원'],
        ['10년 이내 사전증여재산', (val('c_gift') || '0') + ' 천원'],
        ['재산처분액(사망 전 2년 내)', (val('c_disposed') || '0') + ' 천원'],
        ['배우자 생존 여부', selectedLabel('c_spouse_alive')],
        ['자녀 수', selectedLabel('c_children')],
        ['금융재산 합계', (val('c_financial') || '0') + ' 천원'],
        ['가업상속공제', (val('c_business') || '0') + ' 천원'],
      ],
      columnStyles: { 0: { cellWidth: 220 } },
    }));

    var y2 = doc.lastAutoTable.finalY + 24;
    doc.setFont('NotoSansKR', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 35, 45);
    doc.text('계산 결과', 40, y2 - 8);

    var body = [
      ['상속재산 가액', txt('r-asset')],
      ['(+) 사전증여재산', txt('r-gift')],
      ['(+) 추정상속재산', txt('r-estimated')],
      ['(−) 장례비 등', txt('r-funeral')],
      ['(−) 채무·보증금', txt('r-deduct')],
      ['상속세 과세가액', txt('r-taxbase')],
      ['일괄공제 or 기초+인적공제', txt('r-lump')],
      ['배우자공제', txt('r-spouse')],
      ['금융재산공제', txt('r-financial')],
      ['가업상속공제', txt('r-business')],
      ['총 상속공제액', txt('r-totaldeduct')],
      ['과세표준', txt('r-base')],
      ['적용 세율 구간', txt('r-rate')],
      ['산출세액', txt('r-calculated')],
      ['(−) 신고세액공제 (3%)', txt('r-report')],
      ['(−) 기납부 증여세', txt('r-paid')],
    ];

    doc.autoTable(Object.assign(baseTableOptions(y2 + 4), {
      body: body,
      columnStyles: { 0: { cellWidth: 220 }, 1: { halign: 'right' } },
    }));

    var y3 = doc.lastAutoTable.finalY + 6;
    doc.autoTable({
      startY: y3,
      theme: 'plain',
      body: [['납부할 상속세 (추정)', txt('r-tax')]],
      styles: { font: 'NotoSansKR', fontStyle: 'bold', fontSize: 13, textColor: [150, 30, 30], cellPadding: 8 },
      columnStyles: { 0: { cellWidth: 220 }, 1: { halign: 'right' } },
      margin: { left: 40, right: 40 },
    });

    drawFooter(doc, '※ 본 결과는 엑셀 상속세 계산 로직(2025년 기준)을 적용한 간이 추정치입니다. 동거주택 공제·영농상속공제·세대생략할증 등은 포함되지 않았습니다. 정확한 납부세액은 현곡상속신탁설계연구소에 상담 신청해 주십시오.');

    doc.save('상속세_계산결과_' + todayFileStamp() + '.pdf');
  };

})();
