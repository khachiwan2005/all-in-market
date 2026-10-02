class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireAdmin()) return {};
    const nav = AIM.adminNav();
    const day = (AIM.marketDays()[0] || {}).key;
    const on = AIM.bookings().filter((b) => day && b.dates.indexOf(day) !== -1 && ['pending', 'review', 'paid'].indexOf(b.status) !== -1);
    const use = (k) => 'ใช้อยู่ ' + on.filter((b) => b.extras && b.extras[k]).length + ' รายการจอง';
    return Object.assign({}, nav, { useElec: use('elec'), useWater: use('water'), useTent: use('tent'), dayShort: day ? AIM.dateShort(day) : '-' });
  }
}