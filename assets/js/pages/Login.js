class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const submit = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const idv = (document.getElementById('f-id') || {}).value || '', pw = (document.getElementById('f-pw') || {}).value || '';
      if (!idv.trim() || !pw) { this.setState({ err: 'กรอกเบอร์โทรหรืออีเมล และรหัสผ่าน' }); return; }
      const r = AIM.login(idv, pw);
      if (r.needOtp) { location.href = 'Otp.dc.html'; return; }
      if (r.error) { this.setState({ err: r.error }); return; }
      let next = 'Profile.dc.html';
      try { const n = new URLSearchParams(location.search).get('next'); if (n && /^[A-Za-z]+\.dc\.html$/.test(n)) next = n; } catch (x) { /* ignore */ }
      location.href = next;
    };
    return { submit: submit, hasErr: !!st.err, errMsg: st.err || '' };
  }
}