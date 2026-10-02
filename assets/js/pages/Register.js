class Component extends DCLogic {
  renderVals() {
    if (AIM.user()) { location.replace('Profile.dc.html'); }
    const tab = (this.state && this.state.tab) || 'terms';
    const v = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const submit = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const phone = v('f-phone').replace(/[^0-9]/g, '');
      const pw = (document.getElementById('f-pw') || {}).value || '', pw2 = (document.getElementById('f-pw2') || {}).value || '';
      let err = '';
      if (!v('f-name') || !v('f-surname')) err = 'กรอกชื่อและนามสกุล';
      else if (!/^0[0-9]{8,9}$/.test(phone)) err = 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)';
      else if (v('f-email') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('f-email'))) err = 'รูปแบบอีเมลไม่ถูกต้อง';
      else if (!v('f-shop')) err = 'กรอกชื่อร้าน';
      else if (pw.length < 8) err = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
      else if (pw !== pw2) err = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
      else if (!(this.state && this.state.agreed)) err = 'กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว';
      if (!err) { const r = AIM.register({ name: v('f-name'), surname: v('f-surname'), phone: phone, email: v('f-email'), shop: v('f-shop'), type: (document.getElementById('f-type') || {}).value || '', password: pw }); if (r.error) err = r.error; }
      if (err) { this.setState({ err: err }); return; }
      location.href = 'Otp.dc.html';
    };
    const out = {
      submit: submit, hasErr: !!(this.state && this.state.err), errMsg: (this.state && this.state.err) || '',
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
