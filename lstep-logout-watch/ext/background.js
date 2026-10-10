// Lステップ ログアウト記録：記録係（バックグラウンド）
// 記録するのは「時刻・種類・Cookieの名前・消え方・ページのパス」だけ。Cookieの中身（値）は読まない・残さない。
// 記録はこのパソコンの chrome.storage.local にだけ保存し、どこにも送信しない。

const MAX_LOGS = 3000;
const LINESTEP = /(^|\.)linestep\.net$/;

// 書き込みが重なっても記録が消えないよう、1件ずつ順番に保存する
let queue = Promise.resolve();
function addLog(entry) {
  queue = queue.then(async () => {
    const { logs = [] } = await chrome.storage.local.get('logs');
    logs.push({ t: new Date().toISOString(), ...entry });
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
    await chrome.storage.local.set({ logs });
    const kicked = logs.filter(l => l.kind === 'kicked').length;
    await chrome.action.setBadgeText({ text: kicked ? String(kicked) : '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#d93025' });
  }).catch(e => console.error('addLog', e));
  return queue;
}

// 今あるLステップのCookieの「名前・有効期限」だけを控える（ログインの有効時間を知るため）
async function snapshot(label) {
  const all = await chrome.cookies.getAll({});
  const list = all
    .filter(c => LINESTEP.test(c.domain.replace(/^\./, '')))
    .map(c => ({
      name: c.name,
      domain: c.domain,
      session: !!c.session,
      expires: c.expirationDate ? new Date(c.expirationDate * 1000).toISOString() : null
    }));
  await addLog({ kind: 'snapshot', label, cookies: list });
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') await addLog({ kind: 'start' });
  await snapshot(reason === 'install' ? '記録開始時' : '更新時');
});

chrome.runtime.onStartup.addListener(async () => {
  await addLog({ kind: 'chrome_start' });
  await snapshot('Chrome起動時');
});

// ログイン状態（Cookie）が消えた瞬間を記録する
// overwrite（普段の通信での上書き）は毎回起きるので記録しない
chrome.cookies.onChanged.addListener(({ removed, cookie, cause }) => {
  if (!removed || cause === 'overwrite') return;
  if (!LINESTEP.test(cookie.domain.replace(/^\./, ''))) return;
  chrome.storage.session.set({ lastCookieRemoval: { at: Date.now(), cause } });
  addLog({
    kind: 'cookie_removed',
    cause,
    name: cookie.name,
    domain: cookie.domain,
    session: !!cookie.session,
    expires: cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toISOString() : null
  });
});

// タブごとに直前のページを覚えておき、ログイン画面へ飛ばされたら記録する
const isLogin = path => /login|signin|sign_in/i.test(path);
chrome.tabs.onUpdated.addListener(async (tabId, info) => {
  if (!info.url) return;
  let u;
  try { u = new URL(info.url); } catch (e) { return; }
  if (!LINESTEP.test(u.hostname)) return;
  const key = 'tab_' + tabId;
  const prev = (await chrome.storage.session.get(key))[key];
  await chrome.storage.session.set({ [key]: u.pathname });
  if (!isLogin(u.pathname) || !prev || isLogin(prev)) return;
  if (/logout|signout|sign_out/i.test(prev)) {
    addLog({ kind: 'manual_logout', from: prev, to: u.pathname });
    return;
  }
  // 最後に操作してから何分後か／直前2分以内にログイン情報が消えていたか
  // ログアウトにはクリックした瞬間に気づくことが多い。その操作が15秒以内なら、「その前の操作」からの時間を放置時間とみなす
  const { lastActivity, prevActivity, lastCookieRemoval } =
    await chrome.storage.session.get(['lastActivity', 'prevActivity', 'lastCookieRemoval']);
  const now = Date.now();
  let idleMs = null;
  if (lastActivity && now - lastActivity >= 15000) idleMs = now - lastActivity;
  else if (lastActivity && prevActivity) idleMs = lastActivity - prevActivity;
  addLog({
    kind: 'kicked',
    from: prev,
    to: u.pathname,
    idleMin: idleMs == null ? null : Math.round(idleMs / 6000) / 10,
    cookieCause: lastCookieRemoval && now - lastCookieRemoval.at < 120000 ? lastCookieRemoval.cause : null
  });
});

chrome.tabs.onRemoved.addListener(tabId => chrome.storage.session.remove('tab_' + tabId));

// ログイン画面に出ているメッセージ（例：「他の端末でログインされました」）を記録する
let lastMsg = { text: '', at: 0 };
chrome.runtime.onMessage.addListener(msg => {
  if (msg && msg.type === 'activity') {
    chrome.storage.session.get('lastActivity').then(({ lastActivity }) =>
      chrome.storage.session.set({ prevActivity: lastActivity || null, lastActivity: Date.now() }));
    return;
  }
  if (!msg || msg.type !== 'login_page') return;
  const text = (msg.messages || []).join(' / ');
  const now = Date.now();
  if (text === lastMsg.text && now - lastMsg.at < 60000) return;
  lastMsg = { text, at: now };
  addLog({ kind: 'login_page', path: msg.path, messages: msg.messages || [] });
});

// アイコンを押したら記録ページを開く
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('log.html') });
});
