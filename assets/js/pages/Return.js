class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const returned = st.returned || [];
    const others = ['C11', 'C13', 'F01', 'F04', 'F06', 'F07'];
    const data = [
      { id: 'C05', zone: 'โซน C', date: '[วันที่ขาย]', extra: 'ไฟฟ้า', price: '[ราคา] บาท', tone: '#5B3FD6' },
      { id: 'C12', zone: 'โซน C', date: '[วันที่ขาย]', extra: 'ไม่มีบริการเสริม', price: '[ราคา] บาท', tone: '#5B3FD6' },
      { id: 'F03', zone: 'โซน F', date: '[วันที่ขาย]', extra: 'น้ำประปา · โต๊ะ', price: '[ราคา] บาท', tone: '#E0661A' }
    ];
    const mineLeft = data.filter((d) => returned.indexOf(d.id) === -1);
    const sel = (st.sel && mineLeft.some((d) => d.id === st.sel)) ? st.sel : (mineLeft[0] ? mineLeft[0].id : '');
    const done = !!st.done || mineLeft.length === 0;
    const lastId = returned.length ? returned[returned.length - 1] : '';
    const reason = st.reason || 'ติดธุระ ไปขายไม่ได้';
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    let freeCount = 0;
    const cellOf = (id) => {
      const isMine = mineLeft.some((d) => d.id === id);
      const isOther = others.indexOf(id) !== -1;
      const isFresh = id === lastId && done;
      const isPicked = isMine && id === sel && !done;
      const free = !isMine && !isOther && !isFresh;
      if (free || isFresh) freeCount += 1;
      return { id: id, free: free, taken: isOther, mine: isMine && !isPicked, picked: isPicked, fresh: isFresh };
    };
    const zoneC = []; for (let i = 1; i <= 16; i++) zoneC.push(cellOf('C' + pad(i)));
    const zoneF = []; for (let i = 1; i <= 8; i++) zoneF.push(cellOf('F' + pad(i)));
    const bookings = mineLeft.map((d) => Object.assign({}, d, { on: d.id === sel, off: d.id !== sel, pick: () => this.setState({ sel: d.id }) }));
    const reasons = ['ติดธุระ ไปขายไม่ได้', 'สภาพอากาศไม่เอื้ออำนวย', 'ต้องการเปลี่ยนวันขาย', 'สินค้าไม่พร้อม', 'อื่น ๆ'].map((label) => ({ label: label, on: label === reason, off: label !== reason, pick: () => this.setState({ reason: label }) }));
    return {
      zoneC: zoneC,
      zoneF: zoneF,
      freeCount: freeCount,
      bookings: bookings,
      reasons: reasons,
      cur: data.find((d) => d.id === sel) || data[0],
      curReason: reason,
      lastId: lastId,
      done: done,
      notDone: !done,
      hasMore: mineLeft.length > 0,
      confirm: () => this.setState({ done: true, returned: returned.concat([sel]) }),
      again: () => this.setState({ done: false, sel: '' })
    };
  }
}
