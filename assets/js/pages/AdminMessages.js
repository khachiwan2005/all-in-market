class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireAdmin()) return {};
    const st = this.state || {};
    const tab = st.tab || 'new';
    const fmt = (ts) => { const t = new Date(ts); return t.getDate() + ' ' + AIM.MS[t.getMonth()] + ' ' + (t.getFullYear() + 543) + ' ' + AIM.pad(t.getHours()) + ':' + AIM.pad(t.getMinutes()) + ' น.'; };
    const fmtPhone = (p) => (p || '').replace(/^(\d{3})(\d{3})(\d+)$/, '$1-$2-$3');
    const users = AIM.users();
    const base = AIM.messages().sort((a, b) => b.createdAt - a.createdAt).map((m) => {
      const u = users.filter((x) => x.phone === m.phone)[0];
      return { id: m.id, name: m.name, when: fmt(m.createdAt), topic: m.topic || '-', text: m.text, preview: m.text.replace(/\s+/g, ' '), phone: fmtPhone(m.phone), phoneRaw: m.phone, code: m.code || '-', member: u ? 'ร้าน ' + u.shop : 'ไม่ใช่สมาชิก / ไม่พบเบอร์ในระบบ', s: m.status, isNew: m.status === 'new', isDone: m.status === 'done' };
    });
    const list = tab === 'all' ? base : base.filter((m) => m.s === tab);
    const selId = st.sel && base.some((m) => m.id === st.sel) ? st.sel : (list[0] ? list[0].id : '');
    const rows = list.map((m) => Object.assign({}, m, { on: m.id === selId, off: m.id !== selId, pick: () => this.setState({ sel: m.id }) }));
    const cur = base.find((m) => m.id === selId);
    const set = (v) => { if (!cur) return; AIM.setMessageStatus(cur.id, v); this.setState({ sel: cur.id, t: Date.now() }); };
    const out = Object.assign({}, AIM.adminNav(), {
      rows: rows, empty: rows.length === 0, emptyText: tab === 'new' ? 'ไม่มีข้อความใหม่' : 'ไม่มีข้อความในหมวดนี้',
      hasCur: !!cur, noCur: !cur, cur: cur || {}, markDone: () => set('done'), markNew: () => set('new')
    });
    ['new', 'done', 'all'].forEach((k) => {
      out['t_' + k] = tab === k; out['f_' + k] = tab !== k;
      out['n_' + k] = k === 'all' ? base.length : base.filter((m) => m.s === k).length;
      out['go_' + k] = () => this.setState({ tab: k, sel: '' });
    });
    return out;
  }
}