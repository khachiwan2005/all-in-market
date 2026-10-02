class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireAdmin()) return {};
    const st = this.state || {};
    const tab = st.tab || 'pending';
    const fmtD = (ts) => { const t = new Date(ts); return t.getDate() + ' ' + AIM.MS[t.getMonth()] + ' ' + (t.getFullYear() + 543); };
    const base = AIM.refunds().sort((a, b) => b.createdAt - a.createdAt).map((r) => {
      const b = AIM.bookingById(r.bookingId) || { stall: '-', userId: '', dates: [] };
      const ow = AIM.userById(b.userId) || {};
      return { rid: r.id, code: b.code || '-', name: ow.name ? ow.name + ' ' + ow.surname : '-', stall: b.stall, dates: AIM.datesText(b), asked: fmtD(r.createdAt), reason: r.reason, note: r.note || '-', tone: b.stall && b.stall.charAt(0) === 'C' ? '#5B3FD6' : '#E0661A', late: !!r.late, s: r.status };
    });
    const deco = (b) => Object.assign({}, b, { pending: b.s === 'pending', approved: b.s === 'approved', rejected: b.s === 'rejected', inRule: !b.late, late: b.late });
    const list = tab === 'all' ? base : base.filter((b) => b.s === tab);
    const selId = st.sel && base.some((b) => b.rid === st.sel) ? st.sel : (list[0] ? list[0].rid : '');
    const rows = list.map((b) => Object.assign(deco(b), { on: b.rid === selId, off: b.rid !== selId, pick: () => this.setState({ sel: b.rid }) }));
    const curRaw = base.find((b) => b.rid === selId);
    const setS = (v) => { if (!curRaw) return; AIM.setRefundStatus(curRaw.rid, v); this.setState({ sel: curRaw.rid, t: Date.now() }); };
    const out = Object.assign({}, AIM.adminNav(), { rows: rows, empty: rows.length === 0, hasCur: !!curRaw, noCur: !curRaw, cur: curRaw ? deco(curRaw) : {}, approve: () => setS('approved'), reject: () => setS('rejected') });
    ['pending', 'approved', 'rejected', 'all'].forEach((k) => {
      out['t_' + k] = tab === k; out['f_' + k] = tab !== k;
      out['n_' + k] = k === 'all' ? base.length : base.filter((b) => b.s === k).length;
      out['go_' + k] = () => this.setState({ tab: k, sel: '' });
    });
    return out;
  }
}