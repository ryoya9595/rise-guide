# zoom-camera — Zoomでカメラが映らないときの直し方

RISE会員向けの案内ページ（検索除外）。面談中に講師がURLをLINEで送って、受講生が見ながら直す用。

- 公開URL（予定）: https://ryoya9595.github.io/rise-guide/zoom-camera/
- 機種別に開く: `#win` `#mac` `#iphone` `#android` をURLの後ろに付ける（ハッシュ無しならUAで自動判定）

## 構成
- `index.html` … 受講生向け本文（①まずこれ → ②機器別タブ → ③直らないときは2台方式 → ④画面共有（Mac） → ⑤公式リンク）。**講師向けの内容は置かない**
- `koushi.html` … 講師・運営向け（確認の順番＋受講生に送る文面）。受講生ページからはリンクしない。URLは講師にだけ渡す
- `figs/*.html` … 画面の図解。**実機スクショではなくHTMLで描いたイメージ**（権利クリーン・文言が正確・直しやすい）
- `figs/*.png` … 図解の書き出し（2倍解像度）。本文はこのPNGを参照
- `figs/fig-base.css` `annotate.js` … 赤丸・番号・吹き出しの共通部品。`data-target` で対象要素に自動で吸い付く
- `figs/render.sh` … HTML→PNGの書き出し（headless Chrome）

## 図を直すとき
1. `figs/xxx.html` を編集（文言・トグル・注釈）
2. `cd figs && ./render.sh xxx` で同名PNGを更新（引数なしで全部）
3. `index.html` 側は触らなくてOK

## 注意
- Zoom / Windows / macOS / iOS / Android のUI名称はバージョンで変わる。年1回くらい実機と見比べる
- 本物のロゴ・アイコンは使っていない（Zoomブランドガイドの許諾対象）。色付きの四角で代用
