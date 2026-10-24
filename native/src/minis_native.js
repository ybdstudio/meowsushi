/* Native presentation for CST.Minis (js/minis.js keeps the logic: rewards, eligibility, share calls).
   Replaces the DOM parts: side buttons / chips are drawn by ui_native.js, popups use UI.popup(). */
(function (root) {
  const CST = root.CST, M = CST.Minis;
  const today = () => new Date().toISOString().slice(0, 10);
  const fmt = n => { n = Math.floor(n); return n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : String(n); };
  const TT = () => root.tt || (root.TTMinis && root.TTMinis.game) || null;
  const can = (o, n) => !!(o && typeof o[n] === 'function' && (!o.canIUse || o.canIUse(n)));
  M.today = today; M.chipList = [];

  M.init = function (app) { this.app = app; this.bind(app.game); };
  M.refresh = function () { };
  M.closePop = function () { this.app.ui.closePopup(); };
  M.chip = function (id, text, icon, life, onTap, onExpire) {
    this.unchip(id);
    if (typeof icon === 'string' && icon.startsWith('<')) icon = 'task';           // the web build passes an inline svg for the task clipboard
    const ch = { id, text, icon, life, onTap, t0: Date.now() }; this.chipList.push(ch);
    this.chips[id] = { el: { remove() { } }, exp: life ? setTimeout(() => { this.unchip(id); onExpire && onExpire(); }, life * 1000) : null };
  };
  M.unchip = function (id) { const c = this.chips[id]; if (c) { clearTimeout(c.exp); delete this.chips[id]; } this.chipList = this.chipList.filter(x => x.id !== id); };

  M.update = function () {
    const g = this.g, S = g.S, A = CST.Ads, C = CST.CONFIG.ADS;
    if (g.phase > this.phase) { this.phase = g.phase; A.tryInter('I3_phase'); }
    const waiting = g.customers.filter(c => ['QUEUE', 'WAIT_FOR_SUSHI', 'WAIT_ORDER', 'EXTRA_WAIT'].includes(c.state)).length;
    if (A.enabled && S.adRushT <= 0 && waiting >= C.rushMinWaiting && A.canReward('R3', C.rushEvery) && A.t > (C.rushAfter || 60)) {
      if (!this.chips.r3) this.chip('r3', `Meow Rush|${C.rushTime}s: staff faster, +${Math.round((C.rushPrice - 1) * 100)}% prices`, 'staff_hero', 0, () => A.reward('R3_rush', () => { S.adRushT = C.rushTime; this.app.ui.toast(`Meow Rush! Staff +${Math.round((C.rushStaff - 1) * 100)}% faster, prices +${Math.round((C.rushPrice - 1) * 100)}% for ${C.rushTime}s`, 'staff_hero', true); }));
    } else if (this.chips.r3 && (waiting < C.rushMinWaiting || S.adRushT > 0)) this.unchip('r3');
    const P = g.player; let pad = null;
    for (const u of g.C.UNLOCKS) { if (!g.padVisible(u) || !u.cost || Math.hypot(P.x - u.pad.x, P.y - u.pad.y) > 34) continue; const rem = u.cost - (S.padPaid[u.id] || 0); if (rem > 0 && S.coins < rem && rem <= u.cost * C.padShortMax) pad = { u, rem }; }
    if (pad && A.enabled && A.canReward('R2')) {
      if (!this.chips.r2 || this.chips.r2.id !== pad.u.id) { this.chip('r2', `Finish ${pad.u.name}|watch ad: build it now`, pad.u.icon, 0, () => A.reward('R2_pad', () => { const rem = pad.u.cost - (S.padPaid[pad.u.id] || 0); S.padPaid[pad.u.id] = pad.u.cost; g.addStat('earned', rem); g.completeUnlock(pad.u.id); })); this.chips.r2.id = pad.u.id; }
    } else if (this.chips.r2) this.unchip('r2');
  };

  const coinsItem = n => ({ t: 'img', art: 'launch_coins', amount: '+' + fmt(n) });
  const bigCoins = n => ({ t: 'img', art: 'launch_coins', amount: 'x' + fmt(n), big: true, plain: true });
  const step = (n, text) => ({ t: 'step', n, text });
  const pic = art => ({ t: 'img', art, plain: true });
  // bottom button: Claim when TikTok says the reward is ready, 'Claimed ✓' once taken, otherwise Go (starts the mission)
  const claimBtn = (claimable, done, onClaim, onGo) => done ? { t: 'btn', label: 'Claimed ✓', style: 'off', fn: null }
    : claimable ? { t: 'btn', label: 'Claim', style: 'yellow', fn: onClaim } : { t: 'btn', label: 'Go', style: 'yellow', fn: onGo };

  // ---- Launch Reward (add to home screen, one time)
  M.popAdd = function () {
    const m = this.st(), C = CST.CONFIG.MINIS, n = this.amount(C.addMinutes), o = TT();
    const go = () => { if (can(o, 'addShortcut')) o.addShortcut({ success: () => { m.added = true; this.g.save(); check(); }, fail: () => this.app.ui.toast('Could not add the shortcut', 'c_fx_heart') }); else { m.added = true; this.g.save(); show(true); } };
    const claim = () => { m.addClaimed = true; this.closePop(); this.grant(n, C.addStars, 'Home screen reward'); try { o && o.reportMissionRewardGranted && o.reportMissionRewardGranted({ type: 'shortcut' }); } catch (e) { } };
    const show = ok => {
      const done = !!m.addClaimed, claimable = ok && !done;
      this.app.ui.popup({ title: 'Launch Reward', hdr: 'hdr_mega', items: [
        step(1, 'Click the button below.'), { t: 'btn', label: m.added ? 'Added ✓' : 'Go', style: m.added ? 'off' : 'yellow', fn: m.added ? null : go },
        step(2, 'Enter the game from the home screen icon.'), pic('launch_phone'),
        step(3, 'Claim rewards.'), bigCoins(n),
        { t: 'note', text: done ? 'Thanks for adding Meow Hotpot!' : `Enter game from home screen to claim rewards. +${C.addStars}★ bonus` },
        claimBtn(claimable, done, claim, go)] });
    };
    const check = () => { if (can(o, 'getShortcutMissionReward')) o.getShortcutMissionReward({ success: r => show(!!(r && r.canReceiveReward)), fail: () => show(!!m.added) }); else show(!!m.added); };
    check();
  };
  // ---- Entry Reward (reopen from the TikTok profile sidebar, once a day)
  M.popRevisit = function () {
    const m = this.st(), n = this.amount(CST.CONFIG.MINIS.revisitMinutes), done = m.revisitDay === today(), o = TT();
    const go = () => { if (can(o, 'startEntranceMission')) o.startEntranceMission({ complete: () => { } }); else { m.visited = today(); this.g.save(); show(true); } };
    const claim = () => { m.revisitDay = today(); this.closePop(); this.grant(n, 0, 'Revisit gift'); try { o && o.reportMissionRewardGranted && o.reportMissionRewardGranted({ type: 'revisit' }); } catch (e) { } };
    const show = ok => this.app.ui.popup({ title: 'Entry Reward', hdr: 'hdr_gift', items: [
      step(1, 'Click profile.'), pic('rev_profile'),
      step(2, 'Click Meow Hotpot in profile.'), pic('rev_menu'),
      step(3, 'Open Meow Hotpot.'), pic('rev_open'),
      step(4, 'Claim reward.'), bigCoins(n),
      { t: 'note', text: done ? 'Come back tomorrow for another gift.' : 'Enter game from sidebar to claim rewards.' },
      claimBtn(ok && !done, done, claim, go)] });
    const q = can(o, 'getEntranceMissionReward') ? 'getEntranceMissionReward' : can(o, 'getRevisitMissionReward') ? 'getRevisitMissionReward' : null;
    if (q) o[q]({ success: r => show(!!(r && r.canReceiveReward)), fail: () => show(false) }); else show(m.visited === today());
  };
  // ---- Share Game (once a day, paid after a successful share)
  M.popShare = function () {
    const m = this.st(), n = this.amount(CST.CONFIG.MINIS.shareMinutes), done = m.shareDay === today();
    this.app.ui.popup({ title: 'Share Game', hdr: 'hdr_mega', items: [pic('share_art'),
      { t: 'cap', text: done ? 'Shared today – come back tomorrow!' : 'Share the game to get rewards!' }, bigCoins(n),
      { t: 'btn', label: done ? 'Shared ✓' : '⇪  Share', style: done ? 'off' : 'yellow', fn: done ? null : () => this.doShare(false, n) }] });
  };
  M.popCoins = function (refresh) {
    const A = CST.Ads, C = CST.CONFIG.ADS, n = this.amount(C.coinsMinutes);
    const w = Math.ceil(this.coinsWait()), ok = A.enabled && w <= 0 && A.canReward('R5', 0);
    const spec = { title: 'Free Coins', hdr: 'hdr_mega', items: [coinsItem(n), { t: 'cap', text: ok ? 'Watch a short video for free coins!' : !A.enabled ? 'Ads are not available right now.' : 'Next free coins in' },
      { t: 'btn', label: ok ? '▶  Watch' : `⏱ ${Math.floor(w / 60)}:${String(w % 60).padStart(2, '0')}`, style: ok ? 'green' : 'off', fn: ok ? () => { this.closePop(); A.reward('R5_coins', () => this.grant(n, 0, 'Free coins')); } : null }] };
    if (refresh) this.app.ui.pop = spec; else this.app.ui.popup(spec);
    if (!ok && A.enabled) { clearTimeout(this._cw); this._cw = setTimeout(() => { if (this.app.ui.pop === spec) this.popCoins(true); }, 1000); }   // live countdown
  };
  M.popRush = function () {
    const C = CST.CONFIG.ADS;
    this.app.ui.popup({ title: 'So Close!', hdr: 'hdr_mega', items: [{ t: 'cap', text: `The Grand Opening rush ended early. Watch a video to keep it going for ${C.rushExtra} more seconds.` },
      { t: 'btn', label: `▶  +${C.rushExtra}s Rush`, style: 'green', fn: () => { this.closePop(); CST.Ads.reward('R6_rush', () => this.g.continueRush(C.rushExtra)); } },
      { t: 'link', text: 'No thanks', fn: () => this.closePop() }] });
  };
})(typeof window !== 'undefined' ? window : globalThis);
