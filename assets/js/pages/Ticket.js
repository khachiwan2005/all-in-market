class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireUser()) return {};
    const st = this.state || {};
    const bk = AIM.draftBooking();
    const owner = bk ? AIM.userById(bk.userId) : null;
    const ds = bk ? bk.dates.slice().sort() : [];
    const paid = !!bk && bk.status === 'paid';
    return {
      saveOpen: !!st.open, saved: !!st.saved, notSaved: !st.saved,
      openSave: () => this.setState({ open: true, saved: false }),
      doSave: () => this.setState({ open: true, saved: true }),
      closeSave: () => this.setState({ open: false }),
      title: !bk ? 'ยังไม่มีใบจอง' : (paid ? 'จองสำเร็จ!' : (bk.status === 'review' ? 'ส่งสลิปแล้ว' : 'รอการชำระเงิน')),
      sub: !bk ? 'ยังไม่มีรายการจอง · ไปเลือกล็อกก่อน' : (paid ? 'ล็อกเป็นของคุณแล้ว เก็บใบจองนี้ไว้แสดงให้เจ้าหน้าที่ในวันขาย' : (bk.status === 'review' ? 'เจ้าหน้าที่กำลังตรวจสลิป เมื่ออนุมัติแล้วใบจองนี้จะเปลี่ยนเป็น "ชำระแล้ว"' : 'ยังไม่ได้แนบสลิปการชำระเงิน')),
      badge: !bk ? '-' : (paid ? 'ชำระแล้ว' : (bk.status === 'review' ? 'รอตรวจสลิป' : 'รอชำระเงิน')),
      paidLine: paid ? 'ชำระเงินแล้ว' : 'รอเจ้าหน้าที่ตรวจสลิป',
      b: bk ? { stall: bk.stall, zone: AIM.zoneOfStall(bk.stall), code: bk.code, datesText: AIM.datesText(bk), days: ds.length, extra: AIM.extrasText(bk), owner: owner ? owner.name + ' ' + owner.surname : '-', shop: owner ? owner.shop : '-' }
        : { stall: '-', zone: '', code: '-', datesText: '-', days: 0, extra: '-', owner: '-', shop: '-' }
    };
  }
}