# EC2インスタンス用のセキュリティグループ
resource "aws_security_group" "ec2_sg" {
  name        = "linebot-ec2-sg"
  description = "Security group for LINE Bot server"
  vpc_id      = aws_vpc.main.id

  # SSHインバウンドルール（管理用）
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr_block]
    description = "SSH"
  }

  # アプリケーションポートインバウンドルール（ALBからのみ）
  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
    description     = "Application Port from ALB"
  }

  # すべてのアウトバウンドトラフィックを許可
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "linebot-ec2-sg"
  }
}

# EC2インスタンス
resource "aws_instance" "linebot_server_vpc" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = aws_subnet.public_subnet_a.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.linebot_profile.name
  depends_on             = [aws_acm_certificate_validation.cert]

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
              mysql -e "CREATE USER 'linebot_user'@'localhost' IDENTIFIED BY '${var.db_password}';"
              mysql -e "GRANT ALL PRIVILEGES ON linebot_db.* TO 'linebot_user'@'localhost';"
              mysql -e "FLUSH PRIVILEGES;"
              
              # PM2のインストール
              npm install -g pm2
              pm2 startup
              EOF

  tags = {
    Name = "linebot-server-vpc"
  }
}

# Elastic IPの割り当て
resource "aws_eip" "linebot_eip_vpc" {
  instance = aws_instance.linebot_server_vpc.id
  vpc      = true

  tags = {
    Name = "linebot-eip-vpc"
  }
}

# EC2インスタンスをターゲットグループに登録
resource "aws_lb_target_group_attachment" "linebot" {
  target_group_arn = aws_lb_target_group.linebot_tg.arn
  target_id        = aws_instance.linebot_server_vpc.id
  port             = var.app_port
}

# 出力の追加
output "instance_vpc_public_ip" {
  description = "Public IP address of the EC2 instance in VPC"
  value       = aws_eip.linebot_eip_vpc.public_ip
} 