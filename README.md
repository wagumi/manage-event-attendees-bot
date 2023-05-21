# discord-event-tracking-bot

## 概要

Discordイベントの参加者をFirestoreに記録し、終了時にNotionに書き込むDiscordボット

## セットアップ方法

### 必要なnpmライブラリをインストール

```shell
npm install
```

### 必要なシークレット情報をローカルに配置

和組DAOのDiscordにて開発メンバーに以下の情報について聞いてみてください。

- Firebaseの認証情報を記録したファイル (wagumi.json)
- Discordボットのシークレットトークン
- 書き込むNotionの情報とAPIシークレットトークン

### ボット起動

```shell
npm start
```

## 本番環境

```shell
pm2 start pm2.config.js
```
