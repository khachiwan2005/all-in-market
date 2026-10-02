class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const TODAY = '2026-10-01';
    const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const MF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const WS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'], WF = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const iso = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d);
    const ALL = []; for (let i = 1; i <= 16; i++) ALL.push('C' + pad(i)); for (let i = 1; i <= 8; i++) ALL.push('F' + pad(i));
    const hash = (str) => { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100003; return h; };
    const pickSet = (seed, n) => { const out = []; let h = hash(seed); while (out.length < n) { h = (h * 73 + 19) % 100003; const id = ALL[h % ALL.length]; if (out.indexOf(id) === -1) out.push(id); } return out; };
    const FIXED = { '2026-10-03': ['C11', 'C13', 'F01', 'F04', 'F06', 'F07'], '2026-10-04': ['C02', 'C05', 'C11', 'F02', 'F03'], '2026-10-10': ['C01', 'C03', 'C12', 'C13', 'C14', 'F05', 'F06', 'F07', 'F08'], '2026-10-17': ALL.slice(), '2026-11-14': ALL.slice() };
    const othersOn = (key) => FIXED[key] || pickSet(key, 3 + (hash(key) % 12));
    // months Oct 2026 .. Mar 2027
    const MONTHS = [];
    for (let i = 0; i < 6; i++) {
      const y = 2026 + Math.floor((9 + i) / 12), m = (9 + i) % 12;
      const dates = [];
      const dim = new Date(y, m + 1, 0).getDate();
      for (let d = 1; d <= dim; d++) { const wd = new Date(y, m, d).getDay(); if (wd === 0 || wd === 6) dates.push({ d: d, wd: wd, key: iso(y, m, d) }); }
      const key = y + '-' + pad(m + 1);
      const taken = key === '2026-10' ? ['C01', 'C02', 'C03', 'C05', 'C11', 'C12', 'C13', 'C14', 'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08'] : (key === '2026-11' ? ['C11', 'C13', 'F01', 'F06'] : pickSet(key, 4 + (hash(key) % 6)));
      MONTHS.push({ key: key, y: y, m: m, label: MS[m] + ' ' + (y + 543), full: MF[m] + ' ' + (y + 543), dates: dates, taken: taken });
    }
    const lastDay = MONTHS[MONTHS.length - 1];
    const lastOpen = lastDay.dates[lastDay.dates.length - 1].d + ' ' + MS[lastDay.m] + ' ' + (lastDay.y + 543);
    const mode = st.mode || 'day';
    const pkg = mode === 'pkg';
    const month = MONTHS.find((m) => m.key === (st.month || '2026-10')) || MONTHS[0];
    const mineAll = st.mine || {};
    const pkgMineFor = (dateKey) => mineAll['pkg-' + dateKey.slice(0, 7)] || [];
    const marketDays = []; MONTHS.forEach((mo) => mo.dates.forEach((d) => { if (d.key > TODAY) marketDays.push({ key: d.key, y: mo.y, m: mo.m, d: d.d, wd: d.wd }); }));
    const HOLDERS = { '2026-10': ['C11', 'F06'], '2026-11': ['C11'] };
    const holdersOf = (mk) => HOLDERS[mk] || pickSet(mk + 'h', 1);
    const bookedOnDate = (key) => { const set = othersOn(key).concat(mineAll[key] || []).concat(pkgMineFor(key)); holdersOf(key.slice(0, 7)).forEach((id) => { if (set.indexOf(id) === -1) set.push(id); }); return set; };
    const freeOn = (key) => ALL.filter((id) => bookedOnDate(key).indexOf(id) === -1).length;
    const dayKey = st.day || '2026-10-03';
    const dObj = marketDays.find((x) => x.key === dayKey) || marketDays[0];
    const shortLabel = (x) => WS[x.wd] + ' ' + x.d + ' ' + MS[x.m];
    const fullLabel = (x) => WF[x.wd] + ' ' + x.d + ' ' + MS[x.m] + ' ' + (x.y + 543);
    const pkgKey = 'pkg-' + month.key;
    const pkgTaken = () => { const set = month.taken.slice(); (mineAll[pkgKey] || []).forEach((id) => { if (set.indexOf(id) === -1) set.push(id); }); month.dates.forEach((d) => (mineAll[d.key] || []).forEach((id) => { if (set.indexOf(id) === -1) set.push(id); })); return set; };
    const selKey = pkg ? pkgKey : dObj.key;
    const booked = pkg ? pkgTaken() : bookedOnDate(dObj.key);
    const isFree = (id) => booked.indexOf(id) === -1;
    const selMap = st.selMap || {};
    let sel = selMap[selKey] === undefined ? (isFree('C05') ? 'C05' : '') : selMap[selKey];
    if (sel && !isFree(sel)) sel = '';
    let freeC = 0, freeF = 0;
    const setSel = (id) => { const m = Object.assign({}, selMap); m[selKey] = id; this.setState({ selMap: m }); };
    const mk = (id) => {
      const isBooked = !isFree(id), isSel = id === sel;
      if (!isBooked) { if (id.charAt(0) === 'C') freeC += 1; else freeF += 1; }
      return { id: id, bl: pkg ? 'ไม่ว่างบางวัน' : 'จองแล้ว', booked: isBooked, selected: isSel && !isBooked, available: !isBooked && !isSel, pick: () => setSel(id) };
    };
    const zoneC = []; for (let i = 1; i <= 16; i++) zoneC.push(mk('C' + pad(i)));
    const zoneF = []; for (let i = 1; i <= 8; i++) zoneF.push(mk('F' + pad(i)));
    // chips: next 3 market days, plus the chosen one if it's further out
    const chipDays = marketDays.slice(0, 3);
    if (!chipDays.some((x) => x.key === dObj.key)) chipDays.push(dObj);
    const days = chipDays.map((x) => ({ label: shortLabel(x), free: freeOn(x.key), on: x.key === dObj.key, off: x.key !== dObj.key, pick: () => this.setState({ day: x.key, justBooked: '' }) }));
    const monthChips = MONTHS.slice(0, 2);
    if (!monthChips.some((m) => m.key === month.key)) monthChips.push(month);
    // calendar
    const calIdx = Math.max(0, Math.min(MONTHS.length - 1, st.calIdx === undefined ? MONTHS.findIndex((m) => m.key === dObj.key.slice(0, 7)) : st.calIdx));
    const cm = MONTHS[calIdx];
    const firstWd = new Date(cm.y, cm.m, 1).getDay();
    const lead = (firstWd + 6) % 7;
    const dim = new Date(cm.y, cm.m + 1, 0).getDate();
    const calCells = [];
    for (let i = 0; i < lead; i++) calCells.push({ blank: true });
    for (let d = 1; d <= dim; d++) {
      const key = iso(cm.y, cm.m, d), wd = new Date(cm.y, cm.m, d).getDay(), isMarket = wd === 0 || wd === 6;
      const isPast = key <= TODAY;
      const free = isMarket && !isPast ? freeOn(key) : 0;
      const chosen = key === dObj.key;
      calCells.push({ d: d, free: free, plain: !isMarket, past: isMarket && isPast, full: isMarket && !isPast && free === 0, market: isMarket && !isPast && free > 0 && !chosen, chosen: isMarket && !isPast && free > 0 && chosen, pick: () => this.setState({ day: key, calOpen: false, justBooked: '' }) });
    }
    const CATS = ['อาหารและเครื่องดื่ม', 'เสื้อผ้าและแฟชั่น', 'ผักผลไม้', 'ของใช้ทั่วไป', 'ขนมและของหวาน'];
    const myOn = pkg ? (mineAll[pkgKey] || []) : (mineAll[dObj.key] || []).concat(pkgMineFor(dObj.key));
    const monthOf = pkg ? month : (MONTHS.find((m) => m.key === dObj.key.slice(0, 7)) || month);
    const bookedList = booked.slice().sort().map((id) => {
      const isC = id.charAt(0) === 'C';
      const isMine = myOn.indexOf(id) !== -1;
      let nDays = 0; if (pkg) month.dates.forEach((d) => { if (bookedOnDate(d.key).indexOf(id) !== -1) nDays += 1; });
      const monthly = !pkg && !isMine && holdersOf(monthOf.key).indexOf(id) !== -1;
      return { id: id, zone: isC ? 'โซน C' : 'โซน F', cat: isMine ? 'ร้านของคุณ' : CATS[hash(id + (pkg ? pkgKey : dObj.key)) % CATS.length],
        chipBg: isC ? '#EDE8FF' : '#FFEBDD', chipFg: isC ? '#4A31C4' : '#A2430C',
        mine: isMine, partial: pkg && !isMine, days: 'ไม่ว่าง ' + Math.max(1, nDays) + '/' + month.dates.length + ' วัน',
        monthly: monthly, daily: !pkg && !isMine && !monthly };
    });
    const loggedIn = !!st.loggedIn;
    return {
      accent: this.props.accent ?? '#5B3FD6',
      dayMode: !pkg, pkgMode: pkg,
      toPkg: () => this.setState({ mode: 'pkg', justBooked: '' }), toDay: () => this.setState({ mode: 'day', justBooked: '' }),
      days: days, dayFull: pkg ? 'แพ็กเกจ ' + month.label + ' · ' + month.dates.length + ' วันตลาด' : fullLabel(dObj),
      months: monthChips.map((m) => ({ label: m.label, count: m.dates.length, on: m.key === month.key, off: m.key !== month.key, pick: () => this.setState({ month: m.key, justBooked: '' }) })),
      allMonths: MONTHS.map((m) => { const t = m.key === month.key ? pkgTaken() : m.taken; return { full: m.full, count: m.dates.length, free: 24 - t.length, on: m.key === month.key, off: m.key !== month.key, pick: () => this.setState({ month: m.key, monOpen: false, justBooked: '' }) }; }),
      monthFull: month.full, pkgDates: month.dates.map((x) => ({ label: WS[x.wd] + ' ' + x.d })), pkgCount: month.dates.length,
      gridTitle: pkg ? 'เลือกล็อกที่ว่างครบทั้งเดือน' : 'แตะล็อกสีเขียวเพื่อเลือก',
      priceLabel: pkg ? 'แพ็กเกจรายเดือน (' + month.dates.length + ' วัน)' : 'ค่าล็อก',
      priceVal: pkg ? '[ราคาแพ็กเกจ] บาท' : '[ราคา] บาท',
      calOpen: !!st.calOpen, monOpen: !!st.monOpen, listOpen: !!st.listOpen,
      openList: () => this.setState({ listOpen: true }),
      bookedList: bookedList, noneBooked: bookedList.length === 0, listTypeHead: pkg ? 'ไม่ว่างกี่วันในเดือน' : 'การจอง',
      bookedC: booked.filter((id) => id.charAt(0) === 'C').length, bookedF: booked.filter((id) => id.charAt(0) === 'F').length,
      openCal: () => this.setState({ calOpen: true, calIdx: undefined }), openMonths: () => this.setState({ monOpen: true }),
      closeAll: () => this.setState({ calOpen: false, monOpen: false, listOpen: false }),
      calTitle: cm.full, calCells: calCells, lastOpen: lastOpen,
      canPrev: calIdx > 0, noPrev: calIdx === 0, canNext: calIdx < MONTHS.length - 1, noNext: calIdx === MONTHS.length - 1,
      calPrev: () => this.setState({ calIdx: calIdx - 1 }), calNext: () => this.setState({ calIdx: calIdx + 1 }),
      zoneC: zoneC, zoneF: zoneF,
      sel: sel, selZone: sel.charAt(0) === 'C' ? 'โซน C' : 'โซน F',
      hasSel: !!sel, noSel: !sel,
      freeC: freeC, freeF: freeF, freeCount: freeC + freeF, bookedCount: booked.length,
      justBooked: st.justBooked || '', hasJust: !!st.justBooked,
      loggedIn: loggedIn, guest: !loggedIn,
      showLogin: !!st.askLogin && !loggedIn,
      askLogin: () => this.setState({ askLogin: true }),
      closeLogin: () => this.setState({ askLogin: false }),
      fakeLogin: () => this.setState({ loggedIn: true, askLogin: false }),
      confirm: () => {
        if (!sel) return;
        if (!loggedIn) { this.setState({ askLogin: true }); return; }
        const m = Object.assign({}, mineAll); m[selKey] = (mineAll[selKey] || []).concat([sel]);
        const sm = Object.assign({}, selMap); sm[selKey] = '';
        this.setState({ mine: m, selMap: sm, justBooked: sel + ' (' + (pkg ? 'แพ็กเกจ ' + month.label : shortLabel(dObj)) + ')' });
      }
    };
  }
}
