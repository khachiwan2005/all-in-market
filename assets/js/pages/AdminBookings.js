class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const tab = st.tab || 'pending';
    const status = Object.assign({ 'AIM-0112': 'pending', 'AIM-0120': 'pending', 'AIM-0121': 'pending', 'AIM-0105': 'paid', 'AIM-0203': 'paid', 'AIM-0099': 'rejected' }, st.status || {});
    const base = [
      { code: 'AIM-0112', name: '[ชื่อผู้จอง]', shop: '[ชื่อร้าน]', stall: 'C12', dates: '10–11 ต.ค. 2569', extra: 'ไม่มี', tone: '#5B3FD6' },
      { code: 'AIM-0120', name: '[ชื่อผู้จอง]', shop: '[ชื่อร้าน]', stall: 'C03', dates: '10 ต.ค. 2569', extra: 'ไฟฟ้า', tone: '#5B3FD6' },
      { code: 'AIM-0121', name: '[ชื่อผู้จอง]', shop: '[ชื่อร้าน]', stall: 'F08', dates: '17 ต.ค. 2569', extra: 'น้ำประปา', tone: '#E0661A' },
      { code: 'AIM-0105', name: '[ชื่อผู้จอง]', shop: '[ชื่อร้าน]', stall: 'C05', dates: '3–4 ต.ค. 2569', extra: 'ไฟฟ้า', tone: '#5B3FD6' },
      { code: 'AIM-0203', name: '[ชื่อผู้จอง]', shop: '[ชื่อร้าน]', stall: 'F03', dates: '17 ต.ค. 2569', extra: 'น้ำประปา · โต๊ะ', tone: '#E0661A' },
      { code: 'AIM-0099', name: '[ชื่อผู้จอง]', shop: '[ชื่อร้าน]', stall: 'C07', dates: '3 ต.ค. 2569', extra: 'ไม่มี', tone: '#5B3FD6' }
    ].map((b) => Object.assign({}, b, { s: status[b.code] }));
    const list = tab === 'all' ? base : base.filter((b) => b.s === tab);
    const selCode = st.sel && base.some((b) => b.code === st.sel) ? st.sel : (list[0] ? list[0].code : '');
    const decorate = (b) => Object.assign({}, b, { pending: b.s === 'pending', paid: b.s === 'paid', rejected: b.s === 'rejected' });
    const rows = list.map((b) => Object.assign(decorate(b), { on: b.code === selCode, off: b.code !== selCode, pick: () => this.setState({ sel: b.code }) }));
    const curRaw = base.find((b) => b.code === selCode);
    const setS = (v) => { const ns = Object.assign({}, st.status || {}); ns[selCode] = v; this.setState({ status: ns, sel: selCode }); };
    const out = { rows: rows, empty: rows.length === 0, hasCur: !!curRaw, noCur: !curRaw, cur: curRaw ? decorate(curRaw) : {}, approve: () => setS('paid'), reject: () => setS('rejected') };
    ['pending', 'paid', 'rejected', 'all'].forEach((k) => {
      out['t_' + k] = tab === k; out['f_' + k] = tab !== k;
      out['n_' + k] = k === 'all' ? base.length : base.filter((b) => b.s === k).length;
      out['go_' + k] = () => this.setState({ tab: k, sel: '' });
    });
    return out;
  }
}
