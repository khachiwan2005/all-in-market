class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireUser()) return {};
    const st = this.state || {};
    const me = AIM.user();
    const TODAY = AIM.todayKey();
    const pad = AIM.pad;
    const lay = AIM.getLayout();
    const idsC = AIM.stallsOfZone(lay.zones.find((z) => z.p === 'C') || { p: 'C', last: 0 }, lay.removed), idsF = AIM.stallsOfZone(lay.zones.find((z) => z.p === 'F') || { p: 'F', last: 0 }, lay.removed);
    // การจองของผู้ใช้ที่ยังคืนได้ (ยังไม่ถึงวันขาย)
    const mineLeft = AIM.bookings().filter((b) => b.userId === me.id && ['pending', 'review', 'paid'].indexOf(b.status) !== -1 && b.dates.slice().sort()[0] > TODAY)
      .map((b) => ({ bid: b.id, id: b.stall, zone: AIM.zoneOfStall(b.stall), date: AIM.datesText(b), extra: AIM.extrasText(b), price: AIM.money(AIM.priceOf(b).total) + ' บาท', stallPrice: AIM.money(AIM.priceOf(b).stall), extraPrice: AIM.money(AIM.priceOf(b).extra), tone: b.stall.charAt(0) === 'C' ? '#5B3FD6' : '#E0661A', first: b.dates.slice().sort()[0], dates: b.dates }));
    let want = st.sel;
    try { const q = new URLSearchParams(location.search).get('b'); if (!want && q) want = q; } catch (x) { /* ignore */ }
    const cur = mineLeft.find((d) => d.bid === want) || mineLeft[0] || null;
    const sel = cur ? cur.bid : '';
    const done = !!st.done;
    const lastId = st.lastId || '';
    const reason = st.reason || 'ติดธุระ ไปขายไม่ได้';
    // ผังล็อกของวันขายที่เลือก
    const dateKey = cur ? cur.first : (st.doneDate || (AIM.marketDays()[0] || {}).key);
    const unavailable = dateKey ? AIM.unavailableOn(dateKey) : AIM.shut();
    const myStalls = AIM.bookings().filter((b) => b.userId === me.id && ['pending', 'review', 'paid'].indexOf(b.status) !== -1 && b.dates.indexOf(dateKey) !== -1).map((b) => b.stall);
    let freeCount = 0;
    const cellOf = (id) => {
      const isMine = myStalls.indexOf(id) !== -1;
      const isOther = unavailable.indexOf(id) !== -1 && !isMine;
      const isFresh = id === lastId && done;
      const isPicked = !!cur && id === cur.id && !done;
      const free = !isMine && !isOther && !isFresh;
      if (free || isFresh) freeCount += 1;
      return { id: id, free: free, taken: isOther, mine: isMine && !isPicked, picked: isPicked, fresh: isFresh };
    };
    const zoneC = idsC.map(cellOf), zoneF = idsF.map(cellOf);
    const bookings = mineLeft.map((d) => Object.assign({}, d, { on: d.bid === sel, off: d.bid !== sel, pick: () => this.setState({ sel: d.bid }) }));
    const reasons = ['ติดธุระ ไปขายไม่ได้', 'สภาพอากาศไม่เอื้ออำนวย', 'ต้องการเปลี่ยนวันขาย', 'สินค้าไม่พร้อม', 'อื่น ๆ'].map((label) => ({ label: label, on: label === reason, off: label !== reason, pick: () => this.setState({ reason: label }) }));
    return {
      zoneC: zoneC, zoneF: zoneF, freeCount: freeCount, bookings: bookings, reasons: reasons,
      cur: cur || { id: '-', date: '-', stallPrice: '0', extraPrice: '0' }, curReason: reason, lastId: lastId,
      done: done, notDone: !done, hasMore: mineLeft.length > 0,
      showMain: !done && mineLeft.length > 0, showEmpty: !done && mineLeft.length === 0,
      confirm: () => {
        if (!cur) return;
        const note = ((document.getElementById('ret-note') || {}).value || '').trim();
        const r = AIM.requestReturn(cur.bid, reason, note);
        if (r.error) return;
        this.setState({ done: true, lastId: cur.id, doneDate: cur.first, sel: '' });
      },
      again: () => this.setState({ done: false, sel: '', lastId: '' })
    };
  }
}