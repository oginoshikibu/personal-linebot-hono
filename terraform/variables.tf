variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "ap-northeast-1" # 東京リージョン
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro" # 低コストのインスタンスタイプ
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
  default     = "ami-0d52744d6551d851e" # Ubuntu 22.04 LTS (HVM), SSD Volume Type (ap-northeast-1)
}

variable "key_name" {
  description = "Name of the key pair to use for SSH access"
  type        = string
  default     = "family-line-bot"
}

variable "ssh_cidr_block" {
  description = "CIDR block for SSH access"
  type        = string
  default     = "0.0.0.0/0" # 本番環境では特定のIPに制限することを推奨
}

variable "app_port" {
  description = "Port on which the application runs"
  type        = number
  default     = 3000
}

variable "db_password" {
  description = "Password for the database user"
  type        = string
  sensitive   = true
  # デフォルト値は設定せず、環境変数TF_VAR_db_passwordまたはterraform.tfvarsから取得
} 