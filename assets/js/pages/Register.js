class Component extends DCLogic {
  renderVals() {
    const tab = (this.state && this.state.tab) || 'terms';
    const out = {
      tabTerms: tab === 'terms', tabTermsOff: tab !== 'terms',
      tabPrivacy: tab === 'privacy', tabPrivacyOff: tab !== 'privacy',
      showTerms: () => this.setState({ tab: 'terms' }),
      showPrivacy: () => this.setState({ tab: 'privacy' }),
      modalOpen: !!(this.state && this.state.modal),
      agreed: !!(this.state && this.state.agreed),
      openTerms: (e) => { if (e && e.preventDefault) e.preventDefault(); this.setState({ modal: true, tab: 'terms' }); },
      openPrivacy: (e) => { if (e && e.preventDefault) e.preventDefault(); this.setState({ modal: true, tab: 'privacy' }); },
      closeModal: () => this.setState({ modal: false }),
      acceptModal: () => this.setState({ modal: false, agreed: true }),
      toggleAgree: () => this.setState({ agreed: !(this.state && this.state.agreed) })
    };
    return out;
  }
}
