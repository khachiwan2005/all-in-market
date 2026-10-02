class Component extends DCLogic {
  renderVals() {
    if (!AIM.requireAdmin()) return {};
    const st = this.state || {};
    const PAL = {
      violet: { tone: '#5B3FD6', chipBg: '#EDE8FF', chipFg: '#4A31C4' },
      orange: { tone: '#E0661A', chipBg: '#FFEBDD', chipFg: '#A2430C' },
      green: { tone: '#1F7A45', chipBg: '#E3F8EA', chipFg: '#0E5A34' },
      blue: { tone: '#1D5FA8', chipBg: '#E3F1FF', chipFg: '#1D5FA8' }
    };
    const lay = AIM.getLayout();
    const zonesRaw = lay.zones;
    const removed = lay.removed || [];
    const shut = lay.shut || [];
    const fresh = st.fresh || [];
    const newZones = st.newZones || [];
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const idsOf = (z) => { const a = []; for (let i = 1; i <= z.last; i++) { const id = z.p + pad(i); if (removed.indexOf(id) === -1) a.push(id); } return a; };
    const allIds = []; zonesRaw.forEach((z) => idsOf(z).forEach((id) => allIds.push(id)));
    const sel = st.sel && allIds.indexOf(st.sel) !== -1 ? st.sel : (allIds[0] || '');
    const zoneOf = (id) => zonesRaw.find((z) => id.indexOf(z.p) === 0 && /^\d+$/.test(id.slice(z.p.length))) || zonesRaw[0];
    const addTo = (zp, n) => {
      const zs = zonesRaw.map((z) => Object.assign({}, z));
      const z = zs.find((x) => x.p === zp); if (!z) return;
      const added = []; for (let i = 1; i <= n; i++) added.push(zp + pad(z.last + i));
      z.last += n;
      AIM.setLayout({ zones: zs }); this.setState({ fresh: fresh.concat(added), sel: added[0], modal: null, toast: 'เพิ่ม ' + (n === 1 ? 'ล็อก ' + added[0] : n + ' ล็อก (' + added[0] + '–' + added[added.length - 1] + ')') + ' ใน' + z.name + ' แล้ว' });
    };
    const zones = zonesRaw.map((z) => {
      const pal = PAL[z.color] || PAL.violet;
      const stalls = idsOf(z).map((id) => {
        const isShut = shut.indexOf(id) !== -1, isSel = id === sel, isFresh = fresh.indexOf(id) !== -1;
        return { id: id, tone: pal.tone, open: !isShut && !isSel && !isFresh, fresh: !isShut && !isSel && isFresh, shut: isShut && !isSel, selOpen: isSel && !isShut, selShut: isSel && isShut, pick: () => this.setState({ sel: id }) };
      });
      return Object.assign({}, z, pal, { stalls: stalls, n: stalls.length, next: z.p + pad(z.last + 1), isNew: newZones.indexOf(z.p) !== -1, add: () => addTo(z.p, 1) });
    });
    const selZone = zoneOf(sel);
    const selPal = PAL[selZone.color] || PAL.violet;
    const selShut = shut.indexOf(sel) !== -1;
    const openCount = allIds.filter((id) => shut.indexOf(id) === -1).length;
    // add-zone form
    const zName = st.zName || '', zPrefixRaw = (st.zPrefix || '').toUpperCase().replace(/[^A-Z]/g, '');
    const zCount = Math.max(1, Math.min(40, parseInt(st.zCount || '8', 10) || 1));
    const zColor = st.zColor || 'green';
    const dup = zonesRaw.some((z) => z.p === zPrefixRaw);
    const zErrMsg = !zName.trim() ? 'กรอกชื่อโซน' : (!zPrefixRaw ? 'กรอกตัวอักษรนำหน้ารหัส (A–Z)' : (dup ? 'ตัวอักษร ' + zPrefixRaw + ' ถูกใช้แล้ว' : ''));
    const zOk = !zErrMsg;
    // add-stall form
    const sZone = st.sZone && zonesRaw.some((z) => z.p === st.sZone) ? st.sZone : selZone.p;
    const sCount = Math.max(1, Math.min(20, st.sCount || 1));
    const sz = zonesRaw.find((z) => z.p === sZone);
    const first = sz.p + pad(sz.last + 1), lastId = sz.p + pad(sz.last + sCount);
    const out = Object.assign({}, AIM.adminNav(), {
      zones: zones, zoneCount: zones.length, total: allIds.length, openCount: openCount, shutCount: allIds.length - openCount,
      sel: sel, zoneName: selZone.name, tone: selPal.tone,
      isOpen: !selShut, isShut: selShut, statusLabel: selShut ? 'ปิดซ่อม' : 'เปิดให้จอง',
      toggle: () => { AIM.setLayout({ shut: selShut ? shut.filter((x) => x !== sel) : shut.concat([sel]) }); this.setState({ sel: sel }); },
      removeSel: () => { if (!sel) return; AIM.setLayout({ removed: removed.concat([sel]) }); this.setState({ sel: '', toast: 'ลบล็อก ' + sel + ' แล้ว' }); },
      hasToast: !!st.toast, toast: st.toast || '',
      mZone: st.modal === 'zone', mStall: st.modal === 'stall',
      openZone: () => this.setState({ modal: 'zone', zName: '', zPrefix: '', zCount: '8', zDesc: '', zColor: 'green' }),
      openStall: () => this.setState({ modal: 'stall', sZone: selZone.p, sCount: 1 }),
      closeModal: () => this.setState({ modal: null }),
      zName: zName, zPrefix: st.zPrefix || '', zCount: st.zCount || '8', zDesc: st.zDesc || '',
      setZName: (e) => this.setState({ zName: e.target.value }),
      setZPrefix: (e) => this.setState({ zPrefix: e.target.value }),
      setZCount: (e) => this.setState({ zCount: e.target.value }),
      setZDesc: (e) => this.setState({ zDesc: e.target.value }),
      zPreview: zPrefixRaw ? 'จะสร้าง ' + (zName || 'โซนใหม่') + ' พร้อม ' + zCount + ' ล็อก: ' + zPrefixRaw + '01 – ' + zPrefixRaw + pad(zCount) : 'กรอกตัวอักษรนำหน้า เพื่อดูรหัสล็อกที่จะสร้าง',
      zErr: !zOk && !!(st.zName || st.zPrefix), zErrMsg: zErrMsg, zOk: zOk, not_zOk: !zOk,
      sCount: sCount, inc: () => this.setState({ sCount: Math.min(20, sCount + 1) }), dec: () => this.setState({ sCount: Math.max(1, sCount - 1) }),
      sPreview: 'จะเพิ่มใน' + sz.name + ': ' + (sCount === 1 ? first : first + ' – ' + lastId), sOk: true, not_sOk: false,
      zonePicks: zonesRaw.map((z) => Object.assign({}, PAL[z.color] || PAL.violet, { name: z.name, on: z.p === sZone, off: z.p !== sZone, pick: () => this.setState({ sZone: z.p }) })),
      confirm: () => {
        if (st.modal === 'zone') {
          if (!zOk) return;
          const nz = { p: zPrefixRaw, name: zName.trim(), last: zCount, color: zColor, desc: (st.zDesc || '').trim() || 'โซนใหม่' };
          const added = []; for (let i = 1; i <= zCount; i++) added.push(zPrefixRaw + pad(i));
          AIM.setLayout({ zones: zonesRaw.concat([nz]) }); this.setState({ newZones: newZones.concat([zPrefixRaw]), fresh: fresh.concat(added), sel: added[0], modal: null, toast: 'สร้าง' + nz.name + ' (' + zCount + ' ล็อก) แล้ว' });
        } else { addTo(sZone, sCount); }
    }
    });
    ['violet', 'orange', 'green', 'blue'].forEach((k) => { out['c_' + k] = zColor === k; out['nc_' + k] = zColor !== k; out['sw_' + k] = PAL[k].tone; out['pick_' + k] = () => this.setState({ zColor: k }); });
    return out;
  }
}
