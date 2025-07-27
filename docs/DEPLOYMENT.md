# 家庭用食事管理LINEボットデプロイ手順書

このドキュメントでは、家庭用食事管理LINEボットをAWS EC2にデプロイする手順を説明します。

## 前提条件

- AWSアカウント
- LINE Developersアカウント
- ドメイン名（オプション、SSL証明書のため推奨）

## 1. LINE Botの設定

### 1.1 LINE Developersでチャネルを作成

1. [LINE Developers Console](https://developers.line.biz/console/)にログイン
2. プロバイダーを選択または新規作成
3. 「新規チャネル作成」をクリック
4. 「Messaging API」を選択
5. 必要情報を入力:
   - チャネル名: 「家庭用食事管理Bot」など
   - チャネル説明: アプリの説明
   - 大業種/小業種: 適切なものを選択
   - メールアドレス: 連絡先メールアドレス
6. 利用規約に同意して「作成」をクリック

### 1.2 チャネルの設定

1. 作成したチャネルの「Messaging API設定」タブを開く
2. 以下の情報を確認してメモ:
   - チャネルシークレット
   - チャネルアクセストークン（発行されていない場合は「発行」をクリック）
3. Webhook設定:
   - Webhook URLは後でEC2インスタンスのURLに設定（一時的に空欄可）
   - Webhook送信を「利用する」に設定
4. 応答設定:
   - Webhook以外の応答方法を「利用しない」に設定

## 2. AWSインフラのセットアップ

### 2.1 EC2インスタンスの準備

EC2インスタンス内でMySQLを実行するため、特別なRDSインスタンスは必要ありません。Terraformを使用してVPC、ALB、EC2インスタンスを設定し、EC2インスタンス内にMySQLをインストールします。

### 2.2 Terraformによるインフラのデプロイ

1. AWS CLIの設定:
```bash
aws configure
```

2. SSH鍵ペアの作成（まだ持っていない場合）:
```bash
aws ec2 create-key-pair --key-name family-line-bot --query 'KeyMaterial' --output text > family-line-bot.pem
chmod 400 family-line-bot.pem
```

3. Terraformの実行:
```bash
cd terraform

# 初期化
terraform init

# terraform.tfvarsファイルの作成
cat > terraform.tfvars << EOF
domain_name = "あなたのドメイン名"
subdomain = "linebot"
key_name = "family-line-bot"
EOF

# 実行計画の確認
terraform plan

# インフラのデプロイ
terraform apply
```

5. デプロイ完了後、以下の情報をメモ:
   - EC2インスタンスのパブリックIP (出力: `instance_vpc_public_ip`)
   - アプリケーションのドメイン名 (出力: `domain_name`)
   - ネームサーバー情報 (出力: `nameservers`)
   - 生成したデータベースパスワード (前のステップで生成した`$DB_PASSWORD`の値)
   
   注意: セキュリティグループは自動的に設定されます。MySQLは内部でのみアクセス可能です。

## 3. EC2インスタンスの設定

### 3.1 EC2インスタンスに接続

```bash
ssh -i family-line-bot.pem ubuntu@<EC2_PUBLIC_IP>
```

注意: EC2インスタンスのパブリックIPは、Terraformの出力 `instance_vpc_public_ip` から確認できます。

### 3.2 ソフトウェアの確認

EC2インスタンスには、Terraformのuser_dataで以下のソフトウェアが既にインストールされています：
- Node.js
- MySQL（サーバーとクライアント）
- PM2

以下のコマンドで各ソフトウェアがインストールされていることを確認します：

```bash
# システムの更新
sudo apt update
sudo apt upgrade -y

# 各ソフトウェアのバージョン確認
node -v
pnpm -v
mysql --version
pm2 -v

# MySQLサービスの状態確認
sudo systemctl status mysql
```

注意: Terraformのuser_dataでMySQLの初期設定（データベースとユーザーの作成）も既に行われています。

### 3.3 アプリケーションディレクトリの作成

```bash
# アプリケーションディレクトリを作成
sudo mkdir -p /var/www/linebot
sudo chown ubuntu:ubuntu /var/www/linebot
```

## 4. データベースの確認

### 4.1 データベースとユーザーの確認

Terraformのuser_dataで既に以下の設定が行われています：
- データベース名: `linebot_db`
- ユーザー名: `linebot_user`
- パスワード: Terraformデプロイ時に生成した値

以下のコマンドで確認できます：

```bash
# MySQLサーバーに接続（rootユーザーで）
sudo mysql

# MySQLプロンプト内で実行
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User='linebot_user';
SHOW GRANTS FOR 'linebot_user'@'localhost';
EXIT;
```

## 5. アプリケーションのデプロイ

### 5.1 コードのクローンとビルド

```bash
# アプリケーションディレクトリに移動
cd /var/www/linebot

# リポジトリをクローン
git clone https://github.com/yourusername/personal-linebot-hono.git .

# 依存関係のインストール
pnpm install

# 環境変数ファイルの作成
cat > .env << EOF
# データベース設定
DATABASE_URL="mysql://linebot_user:${DB_PASSWORD}@localhost:3306/linebot_db"

# LINE Bot設定
LINE_CHANNEL_SECRET="your_line_channel_secret"
LINE_CHANNEL_ACCESS_TOKEN="your_line_channel_access_token"

# サーバー設定
PORT=3000
HOST="0.0.0.0"

# 通知設定
MORNING_NOTIFICATION_HOUR=7
MORNING_NOTIFICATION_MINUTE=0
EVENING_NOTIFICATION_HOUR=22
EVENING_NOTIFICATION_MINUTE=0
EOF

# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーション
npx prisma migrate deploy

# アプリケーションのビルド
pnpm run build
```

### 5.2 PM2でアプリケーションを実行

```bash
# PM2でアプリケーションを起動
pm2 start dist/index.js --name "linebot"

# PM2の起動スクリプトを設定
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 現在の設定を保存
pm2 save
```

## 6. ALBとドメイン設定の確認

### 6.1 ドメイン設定

Terraformで作成したRoute 53ホストゾーンのネームサーバー情報をドメインレジストラに設定します。

1. Terraformの出力から`nameservers`の値を確認
2. ドメインレジストラの管理画面でネームサーバーを上記の値に設定
3. DNSの伝播を待つ（最大48時間、通常は数時間以内）

### 6.2 ALBの動作確認

Terraformで作成したALBは以下の機能を提供します：
- HTTP(80)からHTTPS(443)へのリダイレクト
- SSL証明書の適用
- EC2インスタンスへのトラフィック転送

以下のURLにアクセスして動作確認します：
```
https://<subdomain>.<domain_name>/
```

注意: アプリケーションが起動していないと検証は失敗します。アプリケーションの起動後に検証してください。

## 7. LINE Webhook URLの設定

1. [LINE Developers Console](https://developers.line.biz/console/)に戻る
2. 作成したチャネルの「Messaging API設定」タブを開く
3. Webhook URL設定:
   - `https://<subdomain>.<domain_name>/api/webhook`
   - 例: `https://linebot.oginoshikibu-family-line-bot.com/api/webhook`
4. 「Webhook URL検証」をクリックして接続を確認

注意: アプリケーションが起動していないと検証は失敗します。アプリケーションの起動後に検証してください。

## 8. 動作確認

1. LINE公式アカウントをフレンドに追加
2. メッセージを送信して応答を確認
3. 朝と夜の通知が設定した時間に送信されることを確認

## 9. 継続的デプロイの設定（オプション）

### 9.1 GitHub Actionsの設定

1. GitHubリポジトリに以下のSecretsを設定:
   - `SSH_PRIVATE_KEY`: EC2接続用の秘密鍵
   - `EC2_HOST`: EC2インスタンスのIPアドレス
   - `EC2_USER`: `ubuntu`
   - `APP_DIR`: `/var/www/linebot`
   - `DB_PASSWORD`: データベースパスワード（Terraformデプロイ時に生成した値）

2. `.github/workflows/deploy.yml`ファイルを作成して以下の内容を設定:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts
      
      - name: Deploy to EC2
        env:
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        run: |
          ssh ${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }} "cd ${{ secrets.APP_DIR }} && \
          git pull && \
          pnpm install && \
          npx prisma generate && \
          npx prisma migrate deploy && \
          pnpm run build && \
          pm2 restart linebot"
```

## 10. トラブルシューティング

### 10.1 ログの確認

```bash
# PM2のログを確認
pm2 logs linebot

# Nginxのログを確認
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 10.2 一般的な問題

1. **Webhookエラー**: 
   - LINE Developers ConsoleでWebhook URLが正しく設定されているか確認
   - ALBのヘルスチェックが成功しているか確認（AWSコンソールのEC2 > ターゲットグループ）
   - アプリケーションが正しく起動しているか確認

2. **データベース接続エラー**: 
   - MySQLサービスが実行中か確認 (`sudo systemctl status mysql`)
   - DATABASE_URLが正しいか確認（特にパスワード部分）
   - ユーザー権限が正しく設定されているか確認

3. **アプリケーションが起動しない**: 
   - PM2のログを確認
   - 環境変数が正しく設定されているか確認
   
4. **SSL証明書エラー**:
   - ドメインのDNS設定が正しいか確認
   - Route 53のネームサーバーがドメインレジストラに正しく設定されているか確認

## 11. バックアップと復元

### 11.1 データベースのバックアップ

```bash
# バックアップディレクトリの作成
mkdir -p /home/ubuntu/backups

# パスワードを環境変数から取得
DB_PASSWORD=$(grep DATABASE_URL /var/www/linebot/.env | sed -n 's/.*linebot_user:\([^@]*\)@.*/\1/p')

# 手動バックアップ
mysqldump -u linebot_user -p"${DB_PASSWORD}" linebot_db > /home/ubuntu/backups/backup_$(date +%Y%m%d).sql

# 定期バックアップのcronジョブ設定（パスワードを直接含めないスクリプトを作成）
cat > /home/ubuntu/backup_db.sh << EOF
#!/bin/bash
DB_PASSWORD=\$(grep DATABASE_URL /var/www/linebot/.env | sed -n 's/.*linebot_user:\([^@]*\)@.*/\1/p')
mysqldump -u linebot_user -p"\${DB_PASSWORD}" linebot_db > /home/ubuntu/backups/backup_\$(date +%Y%m%d).sql
EOF

# スクリプトに実行権限を付与
chmod +x /home/ubuntu/backup_db.sh

# cronジョブの設定
echo "0 3 * * * /home/ubuntu/backup_db.sh" | sudo tee -a /etc/crontab
```

### 11.2 アプリケーションのバックアップ

```bash
# 環境変数のバックアップ
cp /var/www/linebot/.env /home/ubuntu/backups/.env.backup
```

## 12. メンテナンス

### 12.1 システムの更新

```bash
sudo apt update
sudo apt upgrade -y
```

### 12.2 Node.jsの更新

```bash
sudo pnpm install -g n
sudo n stable
hash -r
```

### 12.3 アプリケーションの更新

```bash
cd /var/www/linebot
git pull
pnpm install
npx prisma generate
npx prisma migrate deploy
pnpm run build
pm2 restart linebot
```

### 12.4 MySQLの更新とメンテナンス

```bash
# MySQLのバージョン確認
mysql --version

# MySQLサービスのステータス確認
sudo systemctl status mysql

# MySQLの最適化
sudo mysqlcheck --optimize --all-databases

# MySQLのログローテーション確認
sudo ls -la /var/log/mysql/
```

## 13. セキュリティ対策

1. **自動セキュリティアップデート**:
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure unattended-upgrades
   ```

2. **SSH設定の強化**:
   ```bash
   sudo nano /etc/ssh/sshd_config
   # 以下の設定を変更
   # PasswordAuthentication no
   # PermitRootLogin no
   sudo systemctl restart sshd
   ```

3. **セキュリティグループの確認**:
   Terraformで作成されたセキュリティグループは以下のように設定されています：
   - EC2セキュリティグループ: SSHアクセス（指定したCIDRブロックからのみ）とALBからのアプリケーションポートへのアクセスのみを許可
   - ALBセキュリティグループ: HTTP(80)とHTTPS(443)のみを許可

   AWSコンソールからセキュリティグループの設定を確認し、必要に応じて調整してください。

## 14. 監視（オプション）

### 14.1 基本的な監視の設定

```bash
# システムモニタリングツールのインストール
sudo apt install -y htop

# ディスク使用量の監視
sudo apt install -y ncdu
```

### 14.2 CloudWatchエージェントのインストール（オプション）

```bash
# CloudWatchエージェントのインストール
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# 設定ファイルの作成と開始
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json
``` 