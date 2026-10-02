class Component extends DCLogic {
  renderVals() {
    const pad = AIM.pad;
    // ตำแหน่งจุดกดบนภาพแผนผัง (ค่าเรขาคณิตของภาพ ไม่ใช่ข้อมูลการจอง)
    const POS = { 'C01': [363, 49], 'C02': [426, 81], 'C03': [488, 111], 'C04': [551, 143], 'C05': [613, 173], 'C06': [675, 205], 'C07': [738, 236], 'C08': [800, 266], 'C09': [300, 81], 'C10': [363, 111], 'C11': [426, 143], 'C12': [488, 173], 'C13': [551, 205], 'C14': [613, 236], 'C15': [675, 266], 'C16': [738, 298], 'F01': [178, 143], 'F02': [241, 173], 'F03': [303, 205], 'F04': [365, 236], 'F05': [426, 266], 'F06': [488, 298], 'F07': [551, 328], 'F08': [613, 360] };
    const days = AIM.marketDays();
    const day = days[0];
    const lay = AIM.getLayout();
    const zc = lay.zones.find((z) => z.p === 'C') || { last: 0 }, zf = lay.zones.find((z) => z.p === 'F') || { last: 0 };
    const idsC = AIM.stallsOfZone(zc, lay.removed), idsF = AIM.stallsOfZone(zf, lay.removed);
    const unavailable = day ? AIM.unavailableOn(day.key) : AIM.shut();
    const isBusy = (id) => unavailable.indexOf(id) !== -1;
    const firstFree = idsC.concat(idsF).find((id) => !isBusy(id)) || '';
    const stateSel = this.state && this.state.sel;
    const sel = stateSel && !isBusy(stateSel) ? stateSel : firstFree;
    const mk = (id, i) => {
      const busy = isBusy(id), isSel = id === sel;
      return { id: id, booked: busy, selected: isSel && !busy, available: !busy && !isSel, delay: (i * 45) + 'ms', pick: () => this.setState({ sel: id }) };
    };
    const zoneC = idsC.map((id, i) => mk(id, i + 1));
    const zoneF = idsF.map((id, i) => mk(id, idsC.length + i + 1));
    const hots = idsC.concat(idsF).filter((id) => POS[id]).map((id) => ({ id: id, left: POS[id][0] + 'px', top: POS[id][1] + 'px', booked: isBusy(id), free: !isBusy(id) }));
    const freeC = idsC.filter((id) => !isBusy(id)).length, freeF = idsF.filter((id) => !isBusy(id)).length;
    return {
      accent: this.props.accent ?? '#5B3FD6',
      zoneC: zoneC, zoneF: zoneF, hots: hots,
      mapCells: AIM.mapCells(idsC.concat(idsF).map((id) => ({ id: id, busy: isBusy(id), sub: isBusy(id) ? (AIM.shut().indexOf(id) !== -1 ? 'ปิดซ่อม' : 'จองแล้ว') : 'ว่าง' })), 944, 482, 1),
      totalStalls: idsC.length + idsF.length, freeNow: freeC + freeF, zoneCount: lay.zones.length,
      freeC: freeC, freeF: freeF, totalC: idsC.length, totalF: idsF.length,
      dayLabel: day ? AIM.dateFull(day.key) : 'ยังไม่เปิดให้จอง',
      sel: sel, selZone: sel ? AIM.zoneOfStall(sel) : ''
    };
  }
}