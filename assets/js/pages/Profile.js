class Component extends DCLogic {
  renderVals() {
    const tab = (this.state && this.state.tab) || 'all';
    const data = [
      { id: 'C05', zone: 'โซน C', from: '3 ต.ค. 2569', to: '4 ต.ค. 2569', days: 2, code: 'AIM-0105', extra: 'ไฟฟ้า', status: 'paid', tone: '#5B3FD6' },
      { id: 'C12', zone: 'โซน C', from: '10 ต.ค. 2569', to: '11 ต.ค. 2569', days: 2, code: 'AIM-0112', extra: 'ไม่มี', status: 'pending', tone: '#5B3FD6' },
      { id: 'F03', zone: 'โซน F', from: '17 ต.ค. 2569', to: '17 ต.ค. 2569', days: 1, code: 'AIM-0203', extra: 'น้ำประปา · โต๊ะ', status: 'paid', tone: '#E0661A' },
      { id: 'F05', zone: 'โซน F', from: '19 ก.ย. 2569', to: '20 ก.ย. 2569', days: 2, code: 'AIM-0098', extra: 'ไฟฟ้า', status: 'done', tone: '#9A98A6' }
    ];
    const rows = data.map((d) => Object.assign({}, d, {
      paid: d.status === 'paid', pending: d.status === 'pending', done: d.status === 'done', active: d.status !== 'done'
    }));
    const count = (k) => (k === 'all' ? rows.length : rows.filter((r) => r.status === k).length);
    const list = tab === 'all' ? rows : rows.filter((r) => r.status === tab);
    const out = { list: list, empty: list.length === 0 };
    ['all', 'pending', 'paid', 'done'].forEach((k) => {
      out['t_' + k] = tab === k;
      out['f_' + k] = tab !== k;
      out['n_' + k] = count(k);
      out['go_' + k] = () => this.setState({ tab: k });
    });
    return out;
  }
}
