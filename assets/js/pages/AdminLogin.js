class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const submit = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const u = (document.getElementById('f-user') || {}).value || '', p = (document.getElementById('f-pw') || {}).value || '';
      const r = AIM.adminLogin(u, p);
      if (r.error) { this.setState({ err: r.error }); return; }
      location.href = 'AdminDashboard.dc.html';
    };
    return { submit: submit, hasErr: !!st.err, errMsg: st.err || '' };
  }
}