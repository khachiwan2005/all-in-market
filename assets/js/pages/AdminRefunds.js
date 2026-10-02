class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const tab = st.tab || 'pending';
    const status = Object.assign({ 'AIM-0203': 'pending', 'AIM-0131': 'pending', 'AIM-0088': 'approved', 'AIM-0077': 'rejected' }, st.status || {});
    const base = [
      { code: 'AIM-0203', name: '[ชื่อผู้จอง]', stall: 'F03', dates: '17 ต.ค. 2569', asked: '[วันที่]', reason: 'ติดธุระ ไปขายไม่ได้', note: '[รายละเอียดเพิ่มเติมจากผู้จอง]', tone: '#E0661A', late: false },
      { code: 'AIM-0131', name: '[ชื่อผู้จอง]', stall: 'C09', dates: '10 ต.ค. 2569', asked: '[วันที่]', reason: 'สภาพอากาศไม่เอื้ออำนวย', note: '-', tone: '#5B3FD6', late: true },
      { code: 'AIM-0088', name: '[ชื่อผู้จอง]', stall: 'C02', dates: '26 ก.ย. 2569', asked: '[วันที่]', reason: 'ต้องการเปลี่ยนวันขาย', note: '-', tone: '#5B3FD6', late: false },
      { code: 'AIM-0077', name: '[ชื่อผู้จอง]', stall: 'F06', dates: '19 ก.ย. 2569', asked: '[วันที่]', reason: 'อื่น ๆ', note: '-', tone: '#E0661A', late: true }
    ].map((b) => Object.assign({}, b, { s: status[b.code] }));
    const deco = (b) => Object.assign({}, b, { pending: b.s === 'pending', approved: b.s === 'approved', rejected: b.s === 'rejected', inRule: !b.late, late: b.late });
    const list = tab === 'all' ? base : base.filter((b) => b.s === tab);
    const selCode = st.sel && base.some((b) => b.code === st.sel) ? st.sel : (list[0] ? list[0].code : '');
    const rows = list.map((b) => Object.assign(deco(b), { on: b.code === selCode, off: b.code !== selCode, pick: () => this.setState({ sel: b.code }) }));
    const curRaw = base.find((b) => b.code === selCode);
    const setS = (v) => { const ns = Object.assign({}, st.status || {}); ns[selCode] = v; this.setState({ status: ns, sel: selCode }); };
    const out = { rows: rows, empty: rows.length === 0, hasCur: !!curRaw, noCur: !curRaw, cur: curRaw ? deco(curRaw) : {}, approve: () => setS('approved'), reject: () => setS('rejected') };
    const keys = ['pending', 'approved', 'rejected', 'all'];
    keys.forEach((k) => {
      out['t_' + k] = tab === k; out['f_' + k] = tab !== k;
      out['n_' + k] = k === 'all' ? base.length : base.filter((b) => b.s === k).length;
      out['go_' + k] = () => this.setState({ tab: k, sel: '' });
    });
    return out;
  }
}
