class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const tab = st.tab || 'all';
    const status = Object.assign({ u1: 'active', u2: 'active', u3: 'active', u4: 'banned', u5: 'active' }, st.status || {});
    const base = [
      { id: 'u1', name: '[ชื่อผู้ใช้ 1]', init: 'ก', shop: '[ชื่อร้าน]', phone: '08X-XXX-XXXX', type: 'อาหารและเครื่องดื่ม', count: 12, cancels: 1, tone: '#E0661A' },
      { id: 'u2', name: '[ชื่อผู้ใช้ 2]', init: 'ข', shop: '[ชื่อร้าน]', phone: '08X-XXX-XXXX', type: 'เสื้อผ้าและแฟชั่น', count: 7, cancels: 0, tone: '#5B3FD6' },
      { id: 'u3', name: '[ชื่อผู้ใช้ 3]', init: 'ค', shop: '[ชื่อร้าน]', phone: '08X-XXX-XXXX', type: 'ผักผลไม้', count: 20, cancels: 2, tone: '#1F7A45' },
      { id: 'u4', name: '[ชื่อผู้ใช้ 4]', init: 'ง', shop: '[ชื่อร้าน]', phone: '08X-XXX-XXXX', type: 'ของใช้ทั่วไป', count: 3, cancels: 3, tone: '#5A5768' },
      { id: 'u5', name: '[ชื่อผู้ใช้ 5]', init: 'จ', shop: '[ชื่อร้าน]', phone: '08X-XXX-XXXX', type: 'อาหารและเครื่องดื่ม', count: 5, cancels: 0, tone: '#4A31C4' }
    ].map((b) => Object.assign({}, b, { s: status[b.id] }));
    const deco = (b) => Object.assign({}, b, { active: b.s === 'active', banned: b.s === 'banned' });
    const list = tab === 'all' ? base : base.filter((b) => b.s === tab);
    const selId = st.sel && base.some((b) => b.id === st.sel) ? st.sel : (list[0] ? list[0].id : base[0].id);
    const rows = list.map((b) => Object.assign(deco(b), { on: b.id === selId, off: b.id !== selId, pick: () => this.setState({ sel: b.id }) }));
    const curRaw = base.find((b) => b.id === selId);
    const out = { rows: rows, empty: rows.length === 0, cur: deco(curRaw), toggle: () => { const ns = Object.assign({}, st.status || {}); ns[selId] = curRaw.s === 'active' ? 'banned' : 'active'; this.setState({ status: ns, sel: selId }); } };
    const keys = ['all', 'active', 'banned'];
    keys.forEach((k) => {
      out['t_' + k] = tab === k; out['f_' + k] = tab !== k;
      out['n_' + k] = k === 'all' ? base.length : base.filter((b) => b.s === k).length;
      out['go_' + k] = () => this.setState({ tab: k, sel: '' });
    });
    return out;
  }
}
