# ACM証明書とRoute53の設定

# 変数定義
variable "domain_name" {
  description = "The domain name for the application"
  type        = string
  # デフォルト値はユーザーが指定する必要があります
}

variable "subdomain" {
  description = "The subdomain for the application"
  type        = string
  default     = "linebot"
}

# ACMで証明書を作成
resource "aws_acm_certificate" "cert" {
  domain_name       = "${var.subdomain}.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# 証明書検証用のDNSレコード
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = aws_route53_zone.primary.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

# 証明書の検証完了を待機
resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}


# 出力の追加
output "domain_name" {
  description = "The full domain name for the application"
  value       = "${var.subdomain}.${var.domain_name}"
} 