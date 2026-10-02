class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireAdmin()) return {};
    const st = this.state || {};
    const tab = st.tab || 'all';
    const TONES = ['#E0661A', '#5B3FD6', '#1F7A45', '#5A5768', '#4A31C4'];
    const fmtD = (ts) => { const t = new Date(ts); return t.getDate() + ' ' + AIM.MS[t.getMonth()] + ' ' + (t.getFullYear() + 543); };
    const bks = AIM.bookings(), refs = AIM.refunds();
    const base = AIM.users().filter((x) => x.verified).map((x, i) => {
      const mine = bks.filter((b) => b.userId === x.id);
      const myIds = mine.map((b) => b.id);
      return { id: x.id, name: x.name + ' ' + x.surname, init: (x.name || 'ก').charAt(0), shop: x.shop, phone: x.phone.replace(/^(\d{3})(\d{3})(\d+)$/, '$1-$2-$3'), type: x.type || '-', count: mine.length,
        cancels: refs.filter((r) => myIds.indexOf(r.bookingId) !== -1).length, tone: TONES[i % TONES.length], joined: fmtD(x.createdAt), s: x.banned ? 'banned' : 'active' };
    });
    const deco = (b) => Object.assign({}, b, { active: b.s === 'active', banned: b.s === 'banned' });
    const list = tab === 'all' ? base : base.filter((b) => b.s === tab);
    const selId = st.sel && base.some((b) => b.id === st.sel) ? st.sel : (list[0] ? list[0].id : '');
    const rows = list.map((b) => Object.assign(deco(b), { on: b.id === selId, off: b.id !== selId, pick: () => this.setState({ sel: b.id }) }));
    const curRaw = base.find((b) => b.id === selId);
    const blank = { id: '', name: 'ยังไม่มีผู้ใช้', init: '-', shop: '-', phone: '-', type: '-', count: 0, cancels: 0, tone: '#9A98A6', joined: '-', s: 'active' };
    const out = Object.assign({}, AIM.adminNav(), { rows: rows, empty: rows.length === 0, cur: deco(curRaw || blank), toggle: () => { if (!curRaw) return; AIM.setBanned(curRaw.id, curRaw.s === 'active'); this.setState({ sel: curRaw.id, t: Date.now() }); } });
    ['all', 'active', 'banned'].forEach((k) => {
      out['t_' + k] = tab === k; out['f_' + k] = tab !== k;
      out['n_' + k] = k === 'all' ? base.length : base.filter((b) => b.s === k).length;
      out['go_' + k] = () => this.setState({ tab: k, sel: '' });
    });
    return out;
  }
}