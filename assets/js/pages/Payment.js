class Component extends DCLogic {
  renderVals() {
    const has = !!(this.state && this.state.slip);
    return { hasSlip: has, noSlip: !has, upload: () => this.setState({ slip: true }), clear: () => this.setState({ slip: false }) };
  }
}
