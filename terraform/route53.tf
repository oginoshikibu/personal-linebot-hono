# Route 53ホストゾーンの作成
resource "aws_route53_zone" "primary" {
  name = var.domain_name
}

# ネームサーバー情報の出力
output "nameservers" {
  description = "NameServers for the domain"
  value       = aws_route53_zone.primary.name_servers
} 