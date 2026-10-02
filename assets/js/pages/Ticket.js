class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    return {
      saveOpen: !!st.open, saved: !!st.saved, notSaved: !st.saved,
      openSave: () => this.setState({ open: true, saved: false }),
      doSave: () => this.setState({ open: true, saved: true }),
      closeSave: () => this.setState({ open: false })
    };
  }
}
