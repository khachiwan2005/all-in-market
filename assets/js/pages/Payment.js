class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireUser()) return {};
    const st = this.state || {};
    const bk = AIM.draftBooking();
    const has = !!st.slipData || !!(bk && bk.slip);
    const slipName = st.slipName || (bk && bk.slip && bk.slip.name) || '';
    const ds = bk ? bk.dates.slice().sort() : [];
    const pr = AIM.priceOf(bk || { dates: [], mode: 'day', extras: {} });
    const extraRows = bk ? [['elec', 'ไฟฟ้า'], ['water', 'น้ำประปา'], ['tent', 'โต๊ะและเต็นท์']].filter((x) => bk.extras && bk.extras[x[0]]).map((x) => ({ name: x[1], price: AIM.money(pr[x[0]]) })) : [];
    // ย่อรูปสลิปให้เล็กลงก่อนเก็บ (เก็บในเบราว์เซอร์)
    const picked = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) { this.setState({ err: 'แนบได้เฉพาะไฟล์รูปภาพ (JPG หรือ PNG)' }); return; }
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => {
          const sc = Math.min(1, 900 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
          cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc);
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          this.setState({ slipName: f.name, slipData: cv.toDataURL('image/jpeg', 0.7), err: '' });
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
    const submit = () => {
      if (!bk) return;
      const slip = st.slipData ? { name: slipName, img: st.slipData, at: Date.now() } : bk.slip;
      AIM.updateBooking(bk.id, { slip: slip, status: bk.status === 'paid' ? 'paid' : 'review' });
    };
    return {
      hasSlip: has && !!bk, noSlip: !(has && !!bk), slipName: slipName,
      upload: () => { const el = document.getElementById('slip-file'); if (el) el.click(); },
      clear: () => { const el = document.getElementById('slip-file'); if (el) { el.value = ''; el.click(); } },
      picked: picked, submit: submit,
      hint: !bk ? (AIM.draftExpired() ? 'หมดเวลาชำระ ' + AIM.HOLD_MIN + ' นาที ระบบคืนล็อกอัตโนมัติแล้ว · กลับไปเลือกล็อกใหม่' : 'ยังไม่มีรายการจอง · กลับไปเลือกล็อกก่อน') : (st.err || 'แนบสลิปก่อนยืนยัน'),
      extraRows: extraRows,
      b: bk ? { stall: bk.stall, zone: AIM.zoneOfStall(bk.stall), datesText: AIM.datesText(bk), days: ds.length, stallPrice: AIM.money(pr.stall), total: AIM.money(pr.total) } : { stall: '-', zone: '', datesText: 'ยังไม่ได้เลือกล็อก', days: 0, stallPrice: '0', total: '0' }
    };
  }
}