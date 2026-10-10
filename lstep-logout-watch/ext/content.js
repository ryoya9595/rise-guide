// Lステップ ログアウト記録：画面係
// ・ふつうのページ：「最後に操作した時刻」だけを記録係に知らせる（何を押したか・何を入力したかは見ない）
// ・ログイン画面（パスワード欄があるページ）：画面に出ている注意書きの文字だけを拾う。入力欄の中身は読まない。
(() => {
  if (!document.querySelector('input[type="password"]')) {
    let last = 0;
    const ping = () => {
      const now = Date.now();
      if (now - last < 30000) return;
      last = now;
      try { chrome.runtime.sendMessage({ type: 'activity' }); } catch (e) {}
    };
    ping();
    ['click', 'keydown', 'scroll', 'mousemove'].forEach(ev => window.addEventListener(ev, ping, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(); });
    return;
  }

  const seen = new Set();
  const add = s => {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (s && s.length <= 200) seen.add(s);
  };

  document.querySelectorAll('.alert, .error, .errors, .flash, .toast, .notice, .message, .invalid-feedback, [role="alert"]')
    .forEach(el => add(el.innerText));

  const KEYWORDS = /ログイン|ログアウト|セッション|端末|他の|有効期限|期限切れ|タイムアウト|再度|もう一度|認証|IP/;
  (document.body.innerText || '').split('\n').forEach(line => {
    if (KEYWORDS.test(line) && line.trim().length <= 120) add(line);
  });

  chrome.runtime.sendMessage({
    type: 'login_page',
    path: location.pathname,
    messages: [...seen].slice(0, 10)
  });
})();
