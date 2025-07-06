terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# AWSプロバイダーの設定
provider "aws" {
  region = var.aws_region
}

# 以下は新しい設定に移行するためコメントアウト
/*
# EC2インスタンス用のセキュリティグループ
resource "aws_security_group" "linebot_sg" {
  name        = "linebot-sg"
  description = "Security group for LINE Bot server"

  # HTTPSインバウンドルール（Webhook用）
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # HTTPインバウンドルール（開発用、本番環境では削除可能）
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # SSHインバウンドルール（管理用）
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr_block]
    description = "SSH"
  }

  # アプリケーションポートインバウンドルール
  ingress {
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Application Port"
  }

  # MySQLインバウンドルール（内部アクセス用）
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "MySQL"
  }

  # すべてのアウトバウンドトラフィックを許可
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "linebot-sg"
  }
}
*/

# EC2インスタンス用のIAMロール
resource "aws_iam_role" "linebot_role" {
  name = "linebot-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })
}

# EC2インスタンス用のIAMインスタンスプロファイル
resource "aws_iam_instance_profile" "linebot_profile" {
  name = "linebot-profile"
  role = aws_iam_role.linebot_role.name
}

# 以下は新しい設定に移行するためコメントアウト
/*
# EC2インスタンス
resource "aws_instance" "linebot_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.linebot_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.linebot_profile.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y nodejs npm git
              npm install -g n
              n stable
              hash -r
              
              # MySQLのインストール
              apt-get install -y mysql-server
              systemctl enable mysql
              systemctl start mysql
              
              # MySQLの初期設定
              mysql -e "CREATE DATABASE linebot_db;"
              mysql -e "CREATE USER 'linebot_user'@'localhost' IDENTIFIED BY 'LineBot@Password123';"
              mysql -e "GRANT ALL PRIVILEGES ON linebot_db.* TO 'linebot_user'@'localhost';"
              mysql -e "FLUSH PRIVILEGES;"
              
              # Nginxのインストール
              apt-get install -y nginx certbot python3-certbot-nginx
              systemctl enable nginx
              systemctl start nginx
              
              # Nginxの設定
              cat > /etc/nginx/sites-available/linebot <<'NGINX'
              server {
                  listen 80;
                  server_name linebot.oginoshikibu-family-line-bot.com;
              
                  location / {
                      proxy_pass http://localhost:3000;
                      proxy_http_version 1.1;
                      proxy_set_header Upgrade $http_upgrade;
                      proxy_set_header Connection "upgrade";
                      proxy_set_header Host $host;
                      proxy_cache_bypass $http_upgrade;
                  }
              }
              NGINX
              
              # シンボリックリンクを作成
              ln -sf /etc/nginx/sites-available/linebot /etc/nginx/sites-enabled/
              # デフォルト設定を削除
              rm -f /etc/nginx/sites-enabled/default
              # Nginxの設定をテスト
              nginx -t
              # Nginxを再起動
              systemctl restart nginx
              
              # PM2のインストール
              npm install -g pm2
              pm2 startup
              
              # Certbotを使用してSSL証明書を取得（DNSレコードが反映された後に実行する必要があります）
              # 以下のコマンドは手動で実行する必要があります
              # certbot --nginx -d linebot.oginoshikibu-family-line-bot.com
              EOF

  tags = {
    Name = "linebot-server"
  }
}

# Elastic IPの割り当て
resource "aws_eip" "linebot_eip" {
  instance = aws_instance.linebot_server.id
  vpc      = true

  tags = {
    Name = "linebot-eip"
  }
}
*/ 