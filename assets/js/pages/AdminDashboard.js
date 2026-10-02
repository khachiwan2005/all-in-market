class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireAdmin()) return {};
    const nav = AIM.adminNav();
    const TODAY = AIM.todayKey();
    const days = AIM.marketDays();
    // วันที่แสดงผัง: วันนี้ถ้าเป็นวันตลาด ไม่เช่นนั้นวันตลาดถัดไป
    const t = new Date(), wd = t.getDay();
    const dayKey = TODAY;
    const lay = AIM.getLayout();
    const book = AIM.bookings().filter((b) => dayKey && b.dates.indexOf(dayKey) !== -1);
    const stateOf = (id) => {
      if (lay.shut.indexOf(id) !== -1) return 'shut';
      const hit = book.filter((b) => b.stall === id && ['pending', 'review', 'paid', 'returning'].indexOf(b.status) !== -1);
      if (!hit.length) return 'free';
      return hit.some((b) => b.status === 'paid') ? 'booked' : 'wait';
    };
    const STY = { free: ['#E3F8EA', '1.5px solid #9ADDB2', '#0E5A34', 'ว่าง'], wait: ['#FFEBDD', '0 none', '#A2430C', 'รอชำระ'], booked: ['#E4E2EA', '0 none', '#5A5768', 'จองแล้ว'], shut: ['#FFF4EC', '1.5px dashed #E0661A', '#A2430C', 'ปิดซ่อม'] };
    const zoneIds = (p) => AIM.stallsOfZone(lay.zones.find((z) => z.p === p) || { p: p, last: 0 }, lay.removed);
    const cells = (ids) => ids.map((id) => { const s = STY[stateOf(id)]; return { id: id, bg: s[0], bd: s[1], fg: s[2], label: s[3] }; });
    const idsC = zoneIds('C'), idsF = zoneIds('F');
    const all = idsC.concat(idsF);
    const bar = (ids, name) => { const n = ids.filter((id) => ['booked', 'wait'].indexOf(stateOf(id)) !== -1).length; const pct = ids.length ? Math.round(n * 100 / ids.length) : 0; return { text: 'จองแล้ว ' + n + '/' + ids.length + ' · ' + pct + '%', pct: pct + '%' }; };
    const freeNow = all.filter((id) => stateOf(id) === 'free').length;
    const nameOf = (uid) => { const u = AIM.userById(uid); return u ? u.name + ' ' + u.surname : '-'; };
    const slips = AIM.bookings().filter((b) => b.status === 'review').sort((a, b) => a.createdAt - b.createdAt).slice(0, 5).map((b) => ({ stall: b.stall, name: nameOf(b.userId), code: b.code, dates: AIM.datesText(b) }));
    const bkOf = (id) => AIM.bookingById(id);
    const refs = AIM.refunds().filter((r) => r.status === 'pending').slice(0, 3).map((r) => { const b = bkOf(r.bookingId) || { stall: '-', userId: '', dates: [] }; return { stall: b.stall, name: nameOf(b.userId), reason: r.reason, dates: AIM.datesText(b) }; });
    const ym = TODAY.slice(0, 7);
    const revenue = AIM.bookings().filter((b) => b.status === 'paid' && b.paidAt && AIM.iso(new Date(b.paidAt).getFullYear(), new Date(b.paidAt).getMonth(), 1).slice(0, 7) === ym).reduce((a, b) => a + AIM.priceOf(b).total, 0);
    return Object.assign({}, nav, {
      revenue: '฿' + AIM.money(revenue),
      dayLabel: dayKey ? AIM.dateFull(dayKey) : 'ยังไม่มีวันตลาด',
      freeNow: freeNow, total: all.length, shutCount: all.filter((id) => stateOf(id) === 'shut').length,
      nPending: nav.navPending, nRefunds: nav.navRefunds,
      zoneC: cells(idsC), zoneF: cells(idsF), barC: bar(idsC), barF: bar(idsF),
      slips: slips, noSlips: slips.length === 0, refs: refs, noRefs: refs.length === 0
    });
  }
}