/*
 * All IN Market - ที่เก็บข้อมูลกลาง (ใช้ร่วมกันทุกหน้า)
 * เก็บใน localStorage ของเบราว์เซอร์ ไม่มีข้อมูลสมมุติ: เริ่มต้นว่างเปล่า
 * ข้อมูลจะปรากฏเมื่อมีการสมัคร / จอง / ชำระเงิน / ขอคืนล็อกจริงเท่านั้น
 *
 * หมายเหตุ: เป็นต้นแบบฝั่งเบราว์เซอร์ ข้อมูลอยู่เฉพาะเครื่องที่ใช้งาน
 * (ยังไม่แชร์ข้ามเครื่อง และยังไม่ใช่ระบบความปลอดภัยจริง)
 */
(function () {
  'use strict';

  // บัญชีเจ้าของตลาด (แก้ได้ที่นี่) - ใช้เข้าหน้าหลังบ้าน
  var ADMIN = { username: 'admin', password: 'admin1234' };

  var KEY = 'allin.v1';
  var MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  var MF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  var WS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  var WF = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  var BLOCKING = ['pending', 'review', 'paid']; // สถานะที่ถือว่าล็อกถูกจองอยู่

  function blank() {
    return {
      seq: 0,
      users: [],
      bookings: [],
      refunds: [],
      layout: {
        zones: [
          { p: 'C', name: 'โซน C', last: 16, color: 'violet', desc: 'ล็อกในร่ม' },
          { p: 'F', name: 'โซน F', last: 8, color: 'orange', desc: 'ริมทางเดิน' }
        ],
        removed: [], shut: [], fresh: [], newZones: []
      },
      session: { userId: null, admin: false, pendingUserId: null },
      draft: null
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var d = JSON.parse(raw), b = blank(); for (var k in b) if (d[k] === undefined) d[k] = b[k]; return d; }
    } catch (e) { /* ใช้ค่าเริ่มต้น */ }
    return blank();
  }
  function save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* พื้นที่เต็ม/ถูกบล็อก */ } }
  function mutate(fn) { var db = load(); var r = fn(db); save(db); return r; }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function iso(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function todayKey() { var t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()); }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'h' + (h >>> 0).toString(36); }
  function parseKey(k) { var p = k.split('-'); return { y: +p[0], m: +p[1] - 1, d: +p[2] }; }

  // ---------- วันตลาด (เสาร์-อาทิตย์) ----------
  function months(n) {
    var out = [], t = new Date();
    for (var i = 0; i < (n || 6); i++) {
      var y = t.getFullYear() + Math.floor((t.getMonth() + i) / 12), m = (t.getMonth() + i) % 12;
      var dim = new Date(y, m + 1, 0).getDate(), dates = [];
      for (var d = 1; d <= dim; d++) {
        var wd = new Date(y, m, d).getDay();
        if (wd === 0 || wd === 6) dates.push({ d: d, wd: wd, key: iso(y, m, d) });
      }
      out.push({ key: y + '-' + pad(m + 1), y: y, m: m, label: MS[m] + ' ' + (y + 543), full: MF[m] + ' ' + (y + 543), dates: dates });
    }
    return out;
  }
  function marketDays(n) {
    var tk = todayKey(), out = [];
    months(n || 6).forEach(function (mo) { mo.dates.forEach(function (x) { if (x.key > tk) out.push({ key: x.key, y: mo.y, m: mo.m, d: x.d, wd: x.wd }); }); });
    return out;
  }
  function dateLabel(key) { var p = parseKey(key); return p.d + ' ' + MS[p.m] + ' ' + (p.y + 543); }
  function dateShort(key) { var p = parseKey(key), wd = new Date(p.y, p.m, p.d).getDay(); return WS[wd] + ' ' + p.d + ' ' + MS[p.m]; }
  function dateFull(key) { var p = parseKey(key), wd = new Date(p.y, p.m, p.d).getDay(); return WF[wd] + ' ' + p.d + ' ' + MS[p.m] + ' ' + (p.y + 543); }
  // ข้อความวันที่ของการจอง
  function datesText(b) {
    var ds = (b.dates || []).slice().sort();
    if (!ds.length) return '-';
    if (b.mode === 'pkg') { var p0 = parseKey(ds[0]); return 'แพ็กเกจ ' + MS[p0.m] + ' ' + (p0.y + 543) + ' (' + ds.length + ' วัน)'; }
    if (ds.length === 1) return dateLabel(ds[0]);
    var a = parseKey(ds[0]), z = parseKey(ds[ds.length - 1]);
    if (a.m === z.m && a.y === z.y) return ds.map(function (k) { return parseKey(k).d; }).join(', ') + ' ' + MS[a.m] + ' ' + (a.y + 543);
    return dateLabel(ds[0]) + ' – ' + dateLabel(ds[ds.length - 1]);
  }
  var EXTRA_NAME = { elec: 'ไฟฟ้า', water: 'น้ำประปา', tent: 'โต๊ะและเต็นท์' };
  function extrasText(b) {
    var l = []; for (var k in EXTRA_NAME) if (b.extras && b.extras[k]) l.push(EXTRA_NAME[k]);
    return l.length ? l.join(' · ') : 'ไม่มี';
  }

  // ---------- ผังตลาด ----------
  function zones() { return load().layout.zones; }
  function stallsOfZone(z, removed) {
    var a = []; for (var i = 1; i <= z.last; i++) { var id = z.p + pad(i); if ((removed || []).indexOf(id) === -1) a.push(id); }
    return a;
  }
  function allStalls() { var db = load(), a = []; db.layout.zones.forEach(function (z) { a = a.concat(stallsOfZone(z, db.layout.removed)); }); return a; }
  function zoneOfStall(id) { return id.charAt(0) === 'C' ? 'โซน C' : (id.charAt(0) === 'F' ? 'โซน F' : 'โซน ' + id.charAt(0)); }
  function shut() { return load().layout.shut.slice(); }

  // ---------- การจอง ----------
  function isBlocking(b) { return BLOCKING.indexOf(b.status) !== -1; }
  function bookings() { return load().bookings.slice(); }
  function takenOn(key) {
    var out = [];
    load().bookings.forEach(function (b) { if (isBlocking(b) && b.dates.indexOf(key) !== -1 && out.indexOf(b.stall) === -1) out.push(b.stall); });
    return out;
  }
  function unavailableOn(key) { var t = takenOn(key); shut().forEach(function (s) { if (t.indexOf(s) === -1) t.push(s); }); return t; }
  function freeCountOn(key) { var u = unavailableOn(key); return allStalls().filter(function (s) { return u.indexOf(s) === -1; }).length; }
  function bookingById(id) { var r = null; load().bookings.forEach(function (b) { if (b.id === id) r = b; }); return r; }
  function userById(id) { var r = null; load().users.forEach(function (u) { if (u.id === id) r = u; }); return r; }
  function addBooking(o) {
    return mutate(function (db) {
      var u = null; db.users.forEach(function (x) { if (x.id === db.session.userId) u = x; });
      if (!u || u.banned) return { error: 'ต้องเข้าสู่ระบบก่อนจอง' };
      var clash = false;
      o.dates.forEach(function (k) { db.bookings.forEach(function (b) { if (b.stall === o.stall && BLOCKING.indexOf(b.status) !== -1 && b.dates.indexOf(k) !== -1) clash = true; }); });
      if (clash || db.layout.shut.indexOf(o.stall) !== -1) return { error: 'ล็อกนี้ถูกจองไปแล้ว กรุณาเลือกล็อกอื่น' };
      db.seq += 1;
      var n = db.bookings.length + 1;
      var b = { id: 'b' + db.seq, code: 'AIM-' + ('000' + n).slice(-4), userId: u.id, stall: o.stall, dates: o.dates.slice().sort(), mode: o.mode, extras: { elec: false, water: false, tent: false }, status: 'pending', slip: null, createdAt: Date.now() };
      db.bookings.push(b); db.draft = b.id;
      return { booking: b };
    });
  }
  function updateBooking(id, patch) { mutate(function (db) { db.bookings.forEach(function (b) { if (b.id === id) for (var k in patch) b[k] = patch[k]; }); }); }
  function setDraft(id) { mutate(function (db) { db.draft = id; }); }
  function draftBooking() {
    var db = load(), id = null;
    try { var q = new URLSearchParams(location.search).get('b'); if (q) id = q; } catch (e) { /* ignore */ }
    id = id || db.draft;
    var r = null; db.bookings.forEach(function (b) { if (b.id === id) r = b; });
    var u = userOf(db);
    if (r && !db.session.admin && (!u || r.userId !== u.id)) return null;
    return r;
  }

  // ---------- ผู้ใช้ ----------
  function userOf(db) { var r = null; db.users.forEach(function (u) { if (u.id === db.session.userId) r = u; }); return r; }
  function user() { return userOf(load()); }
  function register(o) {
    return mutate(function (db) {
      var phone = (o.phone || '').replace(/[^0-9]/g, '');
      if (db.users.some(function (u) { return u.phone === phone; })) return { error: 'เบอร์โทรนี้สมัครไว้แล้ว' };
      if (o.email && db.users.some(function (u) { return u.email && u.email.toLowerCase() === o.email.toLowerCase(); })) return { error: 'อีเมลนี้สมัครไว้แล้ว' };
      db.seq += 1;
      var u = { id: 'u' + db.seq, name: o.name, surname: o.surname, phone: phone, email: o.email || '', shop: o.shop, type: o.type, pass: hash('aim:' + o.password), verified: false, banned: false, createdAt: Date.now() };
      db.users.push(u); db.session.pendingUserId = u.id;
      return { user: u };
    });
  }
  function pendingUser() { var db = load(), r = null; db.users.forEach(function (u) { if (u.id === db.session.pendingUserId) r = u; }); return r; }
  function verifyPending() {
    return mutate(function (db) {
      var r = null; db.users.forEach(function (u) { if (u.id === db.session.pendingUserId) r = u; });
      if (!r) return { error: 'ไม่พบข้อมูลการสมัคร กรุณาสมัครสมาชิกใหม่' };
      r.verified = true; db.session.userId = r.id; db.session.admin = false; db.session.pendingUserId = null;
      return { user: r };
    });
  }
  function login(idf, pw) {
    return mutate(function (db) {
      var key = (idf || '').trim(), digits = key.replace(/[^0-9]/g, '');
      var u = null;
      db.users.forEach(function (x) { if ((digits && x.phone === digits) || (x.email && x.email.toLowerCase() === key.toLowerCase())) u = x; });
      if (!u || u.pass !== hash('aim:' + pw)) return { error: 'เบอร์โทร/อีเมล หรือรหัสผ่านไม่ถูกต้อง' };
      if (u.banned) return { error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อเจ้าของตลาด' };
      if (!u.verified) { db.session.pendingUserId = u.id; return { error: 'บัญชียังไม่ได้ยืนยันเบอร์โทร', needOtp: true }; }
      db.session.userId = u.id; db.session.admin = false;
      return { user: u };
    });
  }
  function logout() { mutate(function (db) { db.session.userId = null; db.session.admin = false; }); }
  function adminLogin(u, p) {
    if ((u || '').trim() !== ADMIN.username || p !== ADMIN.password) return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    mutate(function (db) { db.session.admin = true; db.session.userId = null; });
    return { ok: true };
  }
  function isAdmin() { return !!load().session.admin; }
  function setBanned(id, v) { mutate(function (db) { db.users.forEach(function (u) { if (u.id === id) u.banned = !!v; }); }); }
  function resetPassword(phone, pw) {
    return mutate(function (db) {
      var d = (phone || '').replace(/[^0-9]/g, ''), u = null;
      db.users.forEach(function (x) { if (x.phone === d) u = x; });
      if (!u) return { error: 'ไม่พบเบอร์โทรนี้ในระบบ' };
      u.pass = hash('aim:' + pw); return { ok: true };
    });
  }

  // ---------- คำขอคืนล็อก ----------
  function refunds() { return load().refunds.slice(); }
  function requestReturn(bookingId, reason, note) {
    return mutate(function (db) {
      var b = null; db.bookings.forEach(function (x) { if (x.id === bookingId) b = x; });
      if (!b) return { error: 'ไม่พบการจอง' };
      db.seq += 1;
      var firstDay = b.dates.slice().sort()[0];
      var r = { id: 'r' + db.seq, bookingId: b.id, reason: reason, note: note || '', status: 'pending', createdAt: Date.now(), late: firstDay <= (function () { var t = new Date(); t.setDate(t.getDate() + 3); return iso(t.getFullYear(), t.getMonth(), t.getDate()); })() };
      db.refunds.push(r); b.status = 'returned'; b.returnedAt = Date.now();
      return { refund: r };
    });
  }
  function setRefundStatus(id, st) { mutate(function (db) { db.refunds.forEach(function (r) { if (r.id === id) r.status = st; }); }); }

  // ---------- ผังตลาด (แอดมิน) ----------
  function getLayout() { return load().layout; }
  function setLayout(patch) { mutate(function (db) { for (var k in patch) db.layout[k] = patch[k]; }); }


  // ---------- แผนผัง 3 มิติ: ตำแหน่งกึ่งกลางหน้าบนของแต่ละล็อกในภาพ 710x351 (ค่าเรขาคณิต) ----------
  var MAP_POS = { C01: [288, 37], C02: [333, 59.5], C03: [379, 82], C04: [424, 104], C05: [469.5, 127], C06: [514.5, 149], C07: [560, 172.5], C08: [604.5, 195],
    C09: [242.5, 59], C10: [288, 82], C11: [333, 104.5], C12: [378.5, 127.5], C13: [423.5, 150], C14: [469, 173], C15: [514.5, 195.5], C16: [559.5, 217.5],
    F01: [151.5, 104.5], F02: [197, 127.5], F03: [243, 149.5], F04: [288.5, 172], F05: [333.5, 195], F06: [379.5, 217], F07: [424.5, 240], F08: [469.5, 263] };
  // cells: [{id, busy, sub, selected}] -> รายการสำหรับวาดทับภาพแผนผัง
  // W,H = ขนาดที่ภาพแสดงจริง (px), ax = จุดยึดแนวนอนของ object-fit:cover (0=ซ้าย, 1=ขวา)
  function mapCells(cells, W, H, ax) {
    var s = Math.max(W / 710, H / 351), ox = (W - 710 * s) * (ax === undefined ? 0.5 : ax), oy = (H - 351 * s) * 0.5;
    var out = [];
    cells.forEach(function (c) {
      var p = MAP_POS[c.id]; if (!p) return;
      out.push({ id: c.id, sub: c.sub,
        l: (p[0] * s + ox).toFixed(1) + 'px', t: (p[1] * s + oy).toFixed(1) + 'px', w: (71 * s).toFixed(1) + 'px', h: (36 * s).toFixed(1) + 'px',
        f1: (12.5 * s).toFixed(1) + 'px', f2: (9 * s).toFixed(1) + 'px',
        fill: c.busy ? '#9CA3B8' : (c.selected ? '#FFD98A' : '#B6E9CA'), ink: c.busy ? '#2B3042' : (c.selected ? '#7A4A00' : '#1A5D32') });
    });
    return out;
  }
  // ---------- สรุปสำหรับเมนูแอดมิน ----------
  function adminNav() {
    var db = load();
    var p = db.bookings.filter(function (b) { return b.status === 'review'; }).length;
    var r = db.refunds.filter(function (x) { return x.status === 'pending'; }).length;
    return { navPending: p, navRefunds: r, hasNavPending: p > 0, hasNavRefunds: r > 0 };
  }
  function requireAdmin() { if (!isAdmin()) { location.replace('AdminLogin.dc.html'); return false; } return true; }
  function requireUser() { if (!user()) { location.replace('Login.dc.html'); return false; } return true; }
  function resetAll() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }


  // ---------- ปรับส่วนหัวเว็บตามสถานะล็อกอิน + ปุ่มออกจากระบบ ----------
  function patchChrome() {
    var u = user(), admin = isAdmin();
    var anchors = document.querySelectorAll('a');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i], t = (a.textContent || '').trim();
      if (a.getAttribute('href') === 'Profile.dc.html' && t.indexOf('บัญชีของฉัน') !== -1) {
        var sp = a.querySelector('span'), tn = a.lastChild;
        if (u) { if (sp && sp.firstChild && sp.firstChild.nodeValue !== (u.name || 'ก').charAt(0)) sp.firstChild.nodeValue = (u.name || 'ก').charAt(0); }
        else { a.setAttribute('href', 'Login.dc.html'); if (sp) sp.style.display = 'none'; if (tn && tn.nodeType === 3) tn.nodeValue = 'เข้าสู่ระบบ'; }
      } else if (a.getAttribute('href') === 'Profile.dc.html' && t.indexOf('บัญชีของฉัน') !== -1 && !u) {
        /* หน้า Profile เอง: ไม่ต้องแก้ */
      }
      // ล็อกอินแล้ว: ปุ่ม "เข้าสู่ระบบ" ในส่วนหัวเปลี่ยนเป็นลิงก์ไปบัญชีของฉัน / ปุ่มชำระเงินบนหน้าแรกไปหน้าจอง
      if (u && a.getAttribute('href') === 'Login.dc.html') {
        if (t === 'เข้าสู่ระบบ' && a.closest('header') && a.firstChild && a.firstChild.nodeType === 3) { a.setAttribute('href', 'Profile.dc.html'); a.firstChild.nodeValue = 'บัญชีของฉัน'; }
        else if (t === 'ยืนยันและชำระเงิน') a.setAttribute('href', 'Booking.dc.html');
      }      if (t === 'ออกจากระบบ' && !a.__aim) { a.__aim = 1; a.addEventListener('click', function () { logout(); }); }
    }
  }
  function startChrome() {
    var timer = null;
    function run() { timer = null; try { patchChrome(); } catch (e) { /* ignore */ } }
    new MutationObserver(function () { if (!timer) timer = setTimeout(run, 30); }).observe(document.documentElement, { childList: true, subtree: true });
    run();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startChrome); else startChrome();
  window.AIM = {
    MS: MS, MF: MF, WS: WS, WF: WF, pad: pad, iso: iso, todayKey: todayKey, months: months, marketDays: marketDays,
    dateLabel: dateLabel, dateShort: dateShort, dateFull: dateFull, datesText: datesText, extrasText: extrasText, parseKey: parseKey,
    zones: zones, stallsOfZone: stallsOfZone, allStalls: allStalls, zoneOfStall: zoneOfStall, shut: shut,
    bookings: bookings, takenOn: takenOn, unavailableOn: unavailableOn, freeCountOn: freeCountOn, bookingById: bookingById, userById: userById,
    addBooking: addBooking, updateBooking: updateBooking, setDraft: setDraft, draftBooking: draftBooking,
    user: user, register: register, pendingUser: pendingUser, verifyPending: verifyPending, login: login, logout: logout,
    adminLogin: adminLogin, isAdmin: isAdmin, setBanned: setBanned, resetPassword: resetPassword, users: function () { return load().users.slice(); },
    refunds: refunds, requestReturn: requestReturn, setRefundStatus: setRefundStatus,
    getLayout: getLayout, setLayout: setLayout, adminNav: adminNav, mapCells: mapCells, requireAdmin: requireAdmin, requireUser: requireUser, resetAll: resetAll
  };
})();
