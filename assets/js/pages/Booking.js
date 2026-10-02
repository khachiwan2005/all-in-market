class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const pad = AIM.pad, MS = AIM.MS;
    const TODAY = AIM.todayKey();
    const lay = AIM.getLayout();
    const zc = lay.zones.find((z) => z.p === 'C') || { p: 'C', last: 0 }, zf = lay.zones.find((z) => z.p === 'F') || { p: 'F', last: 0 };
    const idsC = AIM.stallsOfZone(zc, lay.removed), idsF = AIM.stallsOfZone(zf, lay.removed);
    const ALL = idsC.concat(idsF);
    const TOTAL = ALL.length;
    // เดือนที่เปิดจอง (เฉพาะเดือนที่ยังมีวันตลาดในอนาคต)
    const MONTHS = AIM.months(6).map((m) => Object.assign({}, m, { dates: m.dates.filter((x) => x.key > TODAY) })).filter((m) => m.dates.length > 0);
    const mode = st.mode || 'day';
    const pkg = mode === 'pkg';
    const marketDays = []; MONTHS.forEach((mo) => mo.dates.forEach((x) => marketDays.push({ key: x.key, y: mo.y, m: mo.m, d: x.d, wd: x.wd })));
    if (!MONTHS.length) {
      return { accent: this.props.accent ?? '#5B3FD6', dayMode: true, pkgMode: false, toPkg: () => {}, toDay: () => {}, days: [], dayFull: 'ยังไม่เปิดให้จอง', months: [], allMonths: [], monthFull: '', pkgDates: [], pkgCount: 0, gridTitle: 'ยังไม่มีวันตลาดที่เปิดให้จอง', priceLabel: 'ค่าล็อก', priceVal: '[ราคา] บาท', calOpen: false, monOpen: false, listOpen: false, openList: () => {}, bookedList: [], noneBooked: true, listTypeHead: 'การจอง', bookedC: 0, bookedF: 0, openCal: () => {}, openMonths: () => {}, closeAll: () => {}, calTitle: '', calCells: [], lastOpen: '-', canPrev: false, noPrev: true, canNext: false, noNext: true, calPrev: () => {}, calNext: () => {}, zoneC: [], zoneF: [], mapCells: [], sel: '', selZone: '', hasSel: false, noSel: true, freeC: 0, freeF: 0, freeCount: 0, bookedCount: 0, totalAll: TOTAL, totalC: idsC.length, totalF: idsF.length, justBooked: '', hasJust: false, hasErr: false, errMsg: '', loggedIn: !!AIM.user(), guest: !AIM.user(), showLogin: false, askLogin: () => {}, closeLogin: () => {}, confirm: () => {} };
    }
    const month = MONTHS.find((m) => m.key === st.month) || MONTHS[0];
    const dayKey = st.day;
    const dObj = marketDays.find((x) => x.key === dayKey) || marketDays[0];
    const shortLabel = (x) => AIM.WS[x.wd] + ' ' + x.d + ' ' + MS[x.m];
    const fullLabel = (x) => AIM.WF[x.wd] + ' ' + x.d + ' ' + MS[x.m] + ' ' + (x.y + 543);
    const unavailOn = (key) => AIM.unavailableOn(key);
    const freeOn = (key) => { const u = unavailOn(key); return ALL.filter((id) => u.indexOf(id) === -1).length; };
    // แพ็กเกจรายเดือน: ล็อกที่ว่างครบทุกวันตลาดที่เหลือในเดือน
    const pkgTaken = (mo) => { const set = []; mo.dates.forEach((x) => unavailOn(x.key).forEach((id) => { if (set.indexOf(id) === -1) set.push(id); })); return set; };
    const selKey = pkg ? 'pkg-' + month.key : dObj.key;
    const booked = pkg ? pkgTaken(month) : unavailOn(dObj.key);
    const isFree = (id) => booked.indexOf(id) === -1;
    const selMap = st.selMap || {};
    let sel = selMap[selKey] || '';
    if (sel && (!isFree(sel) || ALL.indexOf(sel) === -1)) sel = '';
    let freeC = 0, freeF = 0;
    const setSel = (id) => { const m = Object.assign({}, selMap); m[selKey] = id; this.setState({ selMap: m, err: '' }); };
    const mk = (id) => {
      const isBooked = !isFree(id), isSel = id === sel;
      if (!isBooked) { if (id.charAt(0) === 'C') freeC += 1; else freeF += 1; }
      return { id: id, bl: pkg ? 'ไม่ว่างบางวัน' : (AIM.shut().indexOf(id) !== -1 ? 'ปิดซ่อม' : 'จองแล้ว'), booked: isBooked, selected: isSel && !isBooked, available: !isBooked && !isSel, pick: () => setSel(id) };
    };
    const zoneC = idsC.map(mk), zoneF = idsF.map(mk);
    const chipDays = marketDays.slice(0, 3);
    if (!chipDays.some((x) => x.key === dObj.key)) chipDays.push(dObj);
    const days = chipDays.map((x) => ({ label: shortLabel(x), free: freeOn(x.key), on: x.key === dObj.key, off: x.key !== dObj.key, pick: () => this.setState({ day: x.key, err: '' }) }));
    const monthChips = MONTHS.slice(0, 2);
    if (!monthChips.some((m) => m.key === month.key)) monthChips.push(month);
    // ปฏิทิน
    const calIdxDefault = Math.max(0, MONTHS.findIndex((m) => m.key === dObj.key.slice(0, 7)));
    const calIdx = Math.max(0, Math.min(MONTHS.length - 1, st.calIdx === undefined ? calIdxDefault : st.calIdx));
    const cm = MONTHS[calIdx];
    const lead = (new Date(cm.y, cm.m, 1).getDay() + 6) % 7;
    const dim = new Date(cm.y, cm.m + 1, 0).getDate();
    const calCells = [];
    for (let i = 0; i < lead; i++) calCells.push({ blank: true });
    for (let n = 1; n <= dim; n++) {
      const key = AIM.iso(cm.y, cm.m, n), wd = new Date(cm.y, cm.m, n).getDay(), isMarket = wd === 0 || wd === 6;
      const isPast = key <= TODAY;
      const free = isMarket && !isPast ? freeOn(key) : 0;
      const chosen = key === dObj.key;
      calCells.push({ d: n, free: free, plain: !isMarket, past: isMarket && isPast, full: isMarket && !isPast && free === 0, market: isMarket && !isPast && free > 0 && !chosen, chosen: isMarket && !isPast && free > 0 && chosen, pick: () => this.setState({ day: key, calOpen: false, err: '' }) });
    }
    // รายการล็อกที่จองแล้วจริง (จากข้อมูลการจอง)
    const me = AIM.user();
    const datesInScope = pkg ? month.dates.map((x) => x.key) : [dObj.key];
    const rows = {};
    AIM.bookings().forEach((b) => {
      if (['pending', 'review', 'paid'].indexOf(b.status) === -1) return;
      const hit = b.dates.filter((k) => datesInScope.indexOf(k) !== -1);
      if (!hit.length) return;
      const r = rows[b.stall] || (rows[b.stall] = { days: 0, mine: false, monthly: false, type: '' });
      r.days = Math.max(r.days, hit.length);
      if (me && b.userId === me.id) r.mine = true;
      if (b.mode === 'pkg') r.monthly = true;
      const ow = AIM.userById(b.userId); if (ow && ow.type) r.type = ow.type;
    });
    const bookedList = Object.keys(rows).sort().map((id) => {
      const r = rows[id], isC = id.charAt(0) === 'C';
      return { id: id, zone: AIM.zoneOfStall(id), cat: r.mine ? 'ร้านของคุณ' : (r.type || '-'), chipBg: isC ? '#EDE8FF' : '#FFEBDD', chipFg: isC ? '#4A31C4' : '#A2430C',
        mine: r.mine, partial: pkg && !r.mine, days: 'ไม่ว่าง ' + r.days + '/' + month.dates.length + ' วัน', monthly: !pkg && !r.mine && r.monthly, daily: !pkg && !r.mine && !r.monthly };
    });
    const lastDay = MONTHS[MONTHS.length - 1];
    const lastOpen = AIM.dateLabel(lastDay.dates[lastDay.dates.length - 1].key);
    const loggedIn = !!me;
    return {
      accent: this.props.accent ?? '#5B3FD6',
      dayMode: !pkg, pkgMode: pkg,
      toPkg: () => this.setState({ mode: 'pkg', err: '' }), toDay: () => this.setState({ mode: 'day', err: '' }),
      days: days, dayFull: pkg ? 'แพ็กเกจ ' + month.label + ' · ' + month.dates.length + ' วันตลาด' : fullLabel(dObj),
      months: monthChips.map((m) => ({ label: m.label, count: m.dates.length, on: m.key === month.key, off: m.key !== month.key, pick: () => this.setState({ month: m.key, err: '' }) })),
      allMonths: MONTHS.map((m) => ({ full: m.full, count: m.dates.length, free: ALL.length - pkgTaken(m).length, on: m.key === month.key, off: m.key !== month.key, pick: () => this.setState({ month: m.key, monOpen: false, err: '' }) })),
      monthFull: month.full, pkgDates: month.dates.map((x) => ({ label: AIM.WS[x.wd] + ' ' + x.d })), pkgCount: month.dates.length,
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
      mapCells: AIM.mapCells(zoneC.concat(zoneF).map((s) => ({ id: s.id, busy: s.booked, sub: s.booked ? s.bl : 'ว่าง', selected: s.selected })), 761, 376, 0),
      sel: sel, selZone: sel ? AIM.zoneOfStall(sel) : '',
      hasSel: !!sel, noSel: !sel,
      freeC: freeC, freeF: freeF, freeCount: freeC + freeF, bookedCount: booked.length,
      totalAll: TOTAL, totalC: idsC.length, totalF: idsF.length,
      justBooked: '', hasJust: false, hasErr: !!st.err, errMsg: st.err || '',
      loggedIn: loggedIn, guest: !loggedIn,
      showLogin: !!st.askLogin && !loggedIn,
      askLogin: () => this.setState({ askLogin: true }),
      closeLogin: () => this.setState({ askLogin: false }),
      confirm: () => {
        if (!sel) return;
        if (!AIM.user()) { this.setState({ askLogin: true }); return; }
        const res = AIM.addBooking({ stall: sel, dates: datesInScope, mode: pkg ? 'pkg' : 'day' });
        if (res.error) { this.setState({ err: res.error }); return; }
        location.href = 'Checkout.dc.html';
      }
    };
  }
}