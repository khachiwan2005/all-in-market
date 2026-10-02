class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const on = Object.assign({ elec: true, water: false, tent: false }, st.on || {});
    const o = {};
    ['elec', 'water', 'tent'].forEach((k) => {
      o[k + 'On'] = on[k]; o[k + 'Off'] = !on[k];
      o[k + 'Toggle'] = () => { const n = Object.assign({}, on); n[k] = !n[k]; this.setState({ on: n }); };
    });
    return o;
  }
}
