class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireUser()) return {};
    const me = AIM.user();
    const tab = (this.state && this.state.tab) || 'all';
    const TODAY = AIM.todayKey();
    const data = AIM.bookings().filter((b) => b.userId === me.id && b.status !== 'returned' && b.status !== 'rejected').sort((a, b) => b.createdAt - a.createdAt).map((b) => {
      const ds = b.dates.slice().sort(), last = ds[ds.length - 1];
      const done = b.status === 'paid' && last < TODAY;
      return { bid: b.id, id: b.stall, zone: AIM.zoneOfStall(b.stall), from: AIM.dateLabel(ds[0]), to: AIM.dateLabel(last), days: ds.length, code: b.code, extra: AIM.extrasText(b),
        status: done ? 'done' : (b.status === 'paid' ? 'paid' : 'pending'), raw: b.status, tone: done ? '#9A98A6' : (b.stall.charAt(0) === 'C' ? '#5B3FD6' : '#E0661A') };
    });
    const rows = data.map((d) => Object.assign({}, d, {
      paid: d.status === 'paid', pending: d.status === 'pending' && d.raw === 'pending', review: d.raw === 'review', done: d.status === 'done',
      hasTicket: d.status === 'paid' || d.raw === 'review', active: d.status !== 'done'
    }));
    const count = (k) => (k === 'all' ? rows.length : rows.filter((r) => r.status === k).length);
    const list = tab === 'all' ? rows : rows.filter((r) => r.status === tab);
    const out = { list: list, empty: list.length === 0, u: { full: me.name + ' ' + me.surname, shop: me.shop, type: me.type, phone: me.phone.replace(/^(\d{3})(\d{3})(\d+)$/, '$1-$2-$3'), init: (me.name || 'ก').charAt(0) } };
    ['all', 'pending', 'paid', 'done'].forEach((k) => {
      out['t_' + k] = tab === k;
      out['f_' + k] = tab !== k;
      out['n_' + k] = count(k);
      out['go_' + k] = () => this.setState({ tab: k });
    });
    return out;
  }
}