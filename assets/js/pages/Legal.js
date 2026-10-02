class Component extends DCLogic {
  renderVals() {
    const tab = (this.state && this.state.tab) || 'terms';
    const out = {
      tabTerms: tab === 'terms', tabTermsOff: tab !== 'terms',
      tabPrivacy: tab === 'privacy', tabPrivacyOff: tab !== 'privacy',
      showTerms: () => this.setState({ tab: 'terms' }),
      showPrivacy: () => this.setState({ tab: 'privacy' }),
      noop: () => {},
      acceptModal: () => {}
    };
    return out;
  }
}
