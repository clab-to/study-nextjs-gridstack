# study-nextjs-gridstack

## 概要
Next.js と GridStack.js を組み合わせたダッシュボードUIの練習・検証用リポジトリです。ドラッグ&ドロップでウィジェットを並べ替えたり、レイアウトを保存・復元する最小構成を試せます。

## 事前準備 / インストール
Node.js が必要です。依存関係は pnpm を前提にしています。

```bash
pnpm install
```

## 起動
開発サーバーを立ち上げて動作確認します。

```bash
pnpm dev
```

起動後、`http://localhost:3000` を開いて確認します。

## 構成
- `app/page.tsx`
  - 画面のエントリーポイント。GridStack の画面を読み込みます。
- `components/dashboard-grid.tsx`
  - GridStack の初期化と操作（追加・保存・読込・リセット）を担当します。
  - LocalStorage への保存キーは `dashboard-grid-layout` です。
- `app/globals.css`
  - GridStack のカード表示スタイルを定義しています。

## できること / 検証ポイント
- **ドラッグ&リサイズ**: グリッド上のウィジェットを移動・サイズ変更できます。
- **追加**: 「Add widget」で新しいウィジェットを追加できます。
- **保存 / 読み込み**: 「Save」「Load」で現在のレイアウトを LocalStorage に保存・復元できます。
- **リセット**: 「Reset」でデフォルトレイアウトに戻せます。
- **初期化ログ**: コンソールログで GridStack 初期化や状態遷移を確認できます。

