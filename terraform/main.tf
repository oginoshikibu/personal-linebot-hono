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
