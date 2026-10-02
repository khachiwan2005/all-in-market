class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const me = AIM.user();
    const submit = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const v = (id) => ((document.getElementById(id) || {}).value || '').trim();
      const phone = v('c-phone').replace(/[^0-9]/g, '');
      let err = '';
      if (!v('c-name')) err = 'กรอกชื่อของคุณ';
      else if (!/^0[0-9]{8,9}$/.test(phone)) err = 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)';
      else if (v('c-text').length < 5) err = 'กรอกข้อความที่ต้องการแจ้งแอดมิน';
      if (err) { this.setState({ err: err, sent: false }); return; }
      AIM.addMessage({ name: v('c-name'), phone: phone, topic: v('c-topic'), code: v('c-code'), text: v('c-text') });
      ['c-code', 'c-text'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
      this.setState({ err: '', sent: true });
    };
    return { pName: st.name !== undefined ? st.name : (me ? me.name + ' ' + me.surname : ''), pPhone: st.phone !== undefined ? st.phone : (me ? me.phone : ''), setName: (e) => this.setState({ name: e.target.value }), setPhone: (e) => this.setState({ phone: e.target.value }), submit: submit, onSubmit: submit, hasErr: !!st.err, errMsg: st.err || '', sent: !!st.sent };
  }
}