class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireAdmin()) return {};
    const st = this.state || {};
    const tab = st.tab || 'pending';
    const fmtAt = (ts) => { if (!ts) return '-'; const t = new Date(ts); return t.getDate() + ' ' + AIM.MS[t.getMonth()] + ' ' + (t.getFullYear() + 543) + ' ' + AIM.pad(t.getHours()) + ':' + AIM.pad(t.getMinutes()) + ' น.'; };
    // แสดงเฉพาะการจองที่ผู้จองส่งสลิปแล้ว (รอตรวจ / อนุมัติ / ไม่ผ่าน)
    const MAP = { review: 'pending', paid: 'paid', rejected: 'rejected' };
    const base = AIM.bookings().filter((b) => MAP[b.status]).sort((a, b) => b.createdAt - a.createdAt).map((b) => {
      const ow = AIM.userById(b.userId) || {};
      const ds = b.dates.slice().sort();
      return { bid: b.id, code: b.code, name: ow.name ? ow.name + ' ' + ow.surname : '-', shop: ow.shop || '-', stall: b.stall, dates: AIM.datesText(b), extra: AIM.extrasText(b), stallPrice: AIM.money(AIM.priceOf(b).stall), total: AIM.money(AIM.priceOf(b).total),
        tone: b.stall.charAt(0) === 'C' ? '#5B3FD6' : '#E0661A', s: MAP[b.status], img: (b.slip && b.slip.img) || '', hasImg: !!(b.slip && b.slip.img), noImg: !(b.slip && b.slip.img), slipAt: fmtAt(b.slip && b.slip.at) };
    });
    const list = tab === 'all' ? base : base.filter((b) => b.s === tab);
    const selId = st.sel && base.some((b) => b.bid === st.sel) ? st.sel : (list[0] ? list[0].bid : '');
    const decorate = (b) => Object.assign({}, b, { pending: b.s === 'pending', paid: b.s === 'paid', rejected: b.s === 'rejected' });
    const rows = list.map((b) => Object.assign(decorate(b), { on: b.bid === selId, off: b.bid !== selId, pick: () => this.setState({ sel: b.bid }) }));
    const curRaw = base.find((b) => b.bid === selId);
    const setS = (v) => { if (!curRaw) return; AIM.updateBooking(curRaw.bid, v === 'paid' ? { status: 'paid', paidAt: Date.now() } : { status: 'rejected' }); this.setState({ sel: curRaw.bid, t: Date.now() }); };
    const out = Object.assign({}, AIM.adminNav(), { rows: rows, empty: rows.length === 0, hasCur: !!curRaw, noCur: !curRaw, cur: curRaw ? decorate(curRaw) : {}, approve: () => setS('paid'), reject: () => setS('rejected') });
    ['pending', 'paid', 'rejected', 'all'].forEach((k) => {
      out['t_' + k] = tab === k; out['f_' + k] = tab !== k;
      out['n_' + k] = k === 'all' ? base.length : base.filter((b) => b.s === k).length;
      out['go_' + k] = () => this.setState({ tab: k, sel: '' });
    });
    return out;
  }
}