class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const step = st.step || 1;
    const val = (id) => ((document.getElementById(id) || {}).value || '').trim();
    const next = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (step === 1) {
        const phone = val('f-phone').replace(/[^0-9]/g, '');
        if (!AIM.users().some((x) => x.phone === phone)) { this.setState({ err: 'ไม่พบเบอร์โทรนี้ในระบบ' }); return; }
        this.setState({ step: 2, phone: phone, err: '' });
      } else if (step === 2) {
        let code = ''; for (let i = 1; i <= 6; i++) code += val('otp' + i);
        if (!/^[0-9]{6}$/.test(code)) { this.setState({ err: 'กรอกรหัสให้ครบ 6 หลัก (ต้นแบบ: ยังไม่ได้เชื่อมระบบ SMS รับรหัสใดก็ได้)' }); return; }
        this.setState({ step: 3, err: '' });
      } else if (step === 3) {
        const pw = (document.getElementById('f-pw') || {}).value || '', pw2 = (document.getElementById('f-pw2') || {}).value || '';
        if (pw.length < 8) { this.setState({ err: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }); return; }
        if (pw !== pw2) { this.setState({ err: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' }); return; }
        const r = AIM.resetPassword(st.phone, pw);
        if (r.error) { this.setState({ err: r.error }); return; }
        this.setState({ step: 4, err: '' });
      }
    };
    const o = { next: next, onSubmit: next, finished: step >= 4, phone: st.phone ? st.phone.replace(/^(\d{3})(\d{3})(\d+)$/, '$1-$2-$3') : '', hasErr: !!st.err, errMsg: st.err || '',
      otpInput: (e) => { const el = e.target; if (el && el.value && el.nextElementSibling) el.nextElementSibling.focus(); } };
    [1, 2, 3].forEach((n) => { o['done' + n] = step > n; o['cur' + n] = step === n; o['todo' + n] = step < n; });
    return o;
  }
}