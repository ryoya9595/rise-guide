// Lステップ ログアウト記録：ログイン画面のメッセージ読み取り係
// パスワード欄があるページ（＝ログイン画面）でだけ動き、画面に出ている注意書きの文字だけを拾う。入力欄の中身は読まない。
(() => {
  if (!document.querySelector('input[type="password"]')) return;

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
