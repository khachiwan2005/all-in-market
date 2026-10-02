class Component extends DCLogic {
  renderVals() {
    const booked = ['C11', 'C13', 'F01', 'F04', 'F06', 'F07'];
    const sel = (this.state && this.state.sel) || 'C05';
    const mk = (id, i) => {
      const isBooked = booked.indexOf(id) !== -1;
      const isSel = id === sel;
      return {
        id: id,
        booked: isBooked,
        selected: isSel && !isBooked,
        available: !isBooked && !isSel,
        delay: (i * 45) + 'ms',
        pick: () => this.setState({ sel: id })
      };
    };
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const zoneC = [];
    for (let i = 1; i <= 16; i++) zoneC.push(mk('C' + pad(i), i));
    const zoneF = [];
    for (let i = 1; i <= 8; i++) zoneF.push(mk('F' + pad(i), 16 + i));
    return {
      accent: this.props.accent ?? '#5B3FD6',
      zoneC: zoneC,
      zoneF: zoneF,
      sel: sel,
      selZone: sel.charAt(0) === 'C' ? 'โซน C' : 'โซน F'
    };
  }
}
