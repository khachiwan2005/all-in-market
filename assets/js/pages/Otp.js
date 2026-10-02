class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const pu = AIM.pendingUser();
    const submit = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      let code = ''; for (let i = 1; i <= 6; i++) code += ((document.getElementById('otp' + i) || {}).value || '').trim();
      if (!/^[0-9]{6}$/.test(code)) { this.setState({ err: 'กรอกรหัสให้ครบ 6 หลัก' }); return; }
      const r = AIM.verifyPending();
      if (r.error) { this.setState({ err: r.error }); return; }
      location.href = 'Profile.dc.html';
    };
    const otpInput = (e) => { const el = e.target; if (el && el.value && el.nextElementSibling) el.nextElementSibling.focus(); };
    return { submit: submit, otpInput: otpInput, phone: pu ? pu.phone.replace(/^(\d{3})(\d{3})(\d+)$/, '$1-$2-$3') : '(ยังไม่มีข้อมูลการสมัคร)', hasErr: !!st.err, errMsg: st.err || '' };
  }
}