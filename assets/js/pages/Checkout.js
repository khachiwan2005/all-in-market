class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireUser()) return {};
    const st = this.state || {};
    const bk = AIM.draftBooking();
    const on = Object.assign({ elec: false, water: false, tent: false }, (bk && bk.extras) || {}, st.on || {});
    const o = {};
    ['elec', 'water', 'tent'].forEach((k) => {
      o[k + 'On'] = on[k]; o[k + 'Off'] = !on[k];
      o[k + 'Toggle'] = () => { const n = Object.assign({}, on); n[k] = !n[k]; if (bk) AIM.updateBooking(bk.id, { extras: n }); this.setState({ on: n }); };
    });
    const ds = bk ? bk.dates.slice().sort() : [];
    o.noBooking = !bk;
    o.b = bk ? { stall: bk.stall, zone: AIM.zoneOfStall(bk.stall), datesText: AIM.datesText(bk), days: ds.length } : { stall: '-', zone: '', datesText: 'ยังไม่ได้เลือกล็อก', days: 0 };
    return o;
  }
}