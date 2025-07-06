output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.linebot_server_vpc.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.linebot_eip_vpc.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.linebot_server_vpc.public_dns
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.ec2_sg.id
}

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = aws_lb.linebot_lb.dns_name
}

output "application_url" {
  description = "URL of the application"
  value       = "https://${var.subdomain}.${var.domain_name}"
}

output "webhook_url" {
  description = "Webhook URL for LINE"
  value       = "https://${var.subdomain}.${var.domain_name}/api/webhook"
} 