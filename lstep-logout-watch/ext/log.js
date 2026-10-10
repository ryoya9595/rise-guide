const CAUSE = {
  expired_overwrite: 'Lステップ側が消した',
  explicit: 'ブラウザ側で消された',
  expired: '有効期限切れ',
  evicted: 'Chromeの容量整理'
};
const pad = n => String(n).padStart(2, '0');
const fmt = iso => {
  const d = new Date(iso);
  const w = '日月火水木金土'[d.getDay()];
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}(${w}) ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const fmtShort = iso => iso ? fmt(iso).slice(5) : '';

function describe(l) {
  switch (l.kind) {
    case 'start': return ['記録開始', 'この拡張機能を入れました'];
    case 'chrome_start': return ['Chrome起動', ''];
    case 'snapshot': return ['ログイン情報の控え（' + l.label + '）',
      (l.cookies || []).map(c => `${c.name}：${c.session ? 'ブラウザを閉じるまで' : '期限 ' + fmtShort(c.expires)}`).join(' ／ ') || 'Lステップのログイン情報なし'];
    case 'cookie_removed': return ['ログイン状態が消えた：' + (CAUSE[l.cause] || l.cause),
      `${l.name}（${l.domain}${l.expires ? '・期限 ' + fmtShort(l.expires) : ''}）`];
    case 'kicked': return ['ログイン画面に戻された', `${l.from} → ${l.to}`];
    case 'manual_logout': return ['自分でログアウト', `${l.from} → ${l.to}`];
    case 'login_page': return ['ログイン画面のメッセージ', (l.messages || []).join(' ／ ') || '（メッセージなし）'];
    default: return [l.kind, ''];
  }
}
const MAIN_KINDS = new Set(['start', 'kicked', 'cookie_removed', 'login_page', 'manual_logout']);

async function render() {
  const { logs = [] } = await chrome.storage.local.get('logs');
  const showAll = document.getElementById('showAll').checked;
  const rows = logs.filter(l => showAll || MAIN_KINDS.has(l.kind)).slice().reverse();

  const kicked = logs.filter(l => l.kind === 'kicked').length;
  const byCause = {};
  logs.filter(l => l.kind === 'cookie_removed').forEach(l => {
    const k = CAUSE[l.cause] || l.cause;
    byCause[k] = (byCause[k] || 0) + 1;
  });
  const since = logs.length ? fmt(logs[0].t).slice(0, 19) : '—';
  document.getElementById('summary').innerHTML =
    `<div class="tile alert"><b>${kicked}</b><span>ログイン画面に戻された回数</span></div>` +
    Object.entries(byCause).map(([k, v]) => `<div class="tile"><b>${v}</b><span>消えた：${k}</span></div>`).join('') +
    `<div class="tile"><b style="font-size:16px">${since}</b><span>記録開始</span></div>`;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  document.getElementById('table').innerHTML = rows.length
    ? '<table><thead><tr><th>時刻</th><th>できごと</th><th>詳しく</th></tr></thead><tbody>' +
      rows.map(l => {
        const [what, detail] = describe(l);
        return `<tr class="${l.kind === 'kicked' ? 'kicked' : ''}"><td class="time">${fmt(l.t)}</td><td>${esc(what)}</td><td>${esc(detail)}</td></tr>`;
      }).join('') + '</tbody></table>'
    : '<div class="tile empty">まだ記録はありません。いつもどおりLステップを使っていてください。</div>';
}

document.getElementById('showAll').addEventListener('change', render);

document.getElementById('copy').addEventListener('click', async () => {
  const { logs = [] } = await chrome.storage.local.get('logs');
  const lines = ['【Lステップ ログアウト記録】', `記録数 ${logs.length}件 ／ ログイン画面に戻された ${logs.filter(l => l.kind === 'kicked').length}回`, ''];
  logs.forEach(l => {
    const [what, detail] = describe(l);
    lines.push(`${fmt(l.t)}\t${what}\t${detail}`);
  });
  await navigator.clipboard.writeText(lines.join('\n'));
  const t = document.getElementById('toast');
  t.textContent = 'コピーしました。Chatworkなどに貼り付けて送ってください';
  setTimeout(() => { t.textContent = ''; }, 5000);
});

document.getElementById('clear').addEventListener('click', async () => {
  if (!confirm('記録を全部消します。よろしいですか？（消すと元に戻せません）')) return;
  await chrome.storage.local.set({ logs: [] });
  await chrome.action.setBadgeText({ text: '' });
  render();
});

chrome.storage.onChanged.addListener(render);
render();
