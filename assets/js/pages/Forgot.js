class Component extends DCLogic {
  renderVals() {
    const step = (this.state && this.state.step) || 1;
    const o = { next: () => this.setState({ step: step + 1 }), finished: step >= 4 };
    [1, 2, 3].forEach((n) => { o['done' + n] = step > n; o['cur' + n] = step === n; o['todo' + n] = step < n; });
    return o;
  }
}
