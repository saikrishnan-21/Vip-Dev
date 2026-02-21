# VIPContentAI - AWS Ollama GPU Instance Terraform Configuration
# Purpose: Deploy Ollama on AWS with GPU (L4/L40S) for LLM inference
# Region: US (us-east-1 or us-west-2)

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configure your S3 backend for state management
    # bucket = "vipcontentai-terraform-state"
    # key    = "ollama/terraform.tfstate"
    # region = "us-east-1"
    # dynamodb_table = "terraform-state-lock"
    # encrypt = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "VIPContentAI"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Component   = "Ollama-GPU"
    }
  }
}

# Data sources
data "aws_ami" "deep_learning_ubuntu" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["Deep Learning Base GPU AMI (Ubuntu 24.04) *"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

data "aws_vpc" "selected" {
  id = var.vpc_id != "" ? var.vpc_id : null
  default = var.vpc_id == "" ? true : false
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.selected.id]
  }

  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }
}

# Security Group for Ollama instance
resource "aws_security_group" "ollama" {
  name_prefix = "vipcontentai-ollama-${var.environment}-"
  description = "Security group for Ollama GPU instance"
  vpc_id      = data.aws_vpc.selected.id

  # HTTPS from anywhere (Nginx)
  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP for Let's Encrypt (temporary)
  ingress {
    description = "HTTP for certbot"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH from office IP only
  ingress {
    description = "SSH from office"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  # Allow all outbound
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "vipcontentai-ollama-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 instance
resource "aws_iam_role" "ollama" {
  name_prefix = "vipcontentai-ollama-${var.environment}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "vipcontentai-ollama-${var.environment}"
  }
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "ollama_cloudwatch" {
  name_prefix = "cloudwatch-logs-"
  role        = aws_iam_role.ollama.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach SSM policy for Systems Manager access
resource "aws_iam_role_policy_attachment" "ollama_ssm" {
  role       = aws_iam_role.ollama.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ollama" {
  name_prefix = "vipcontentai-ollama-${var.environment}-"
  role        = aws_iam_role.ollama.name

  tags = {
    Name = "vipcontentai-ollama-${var.environment}"
  }
}

# User data script
locals {
  user_data = templatefile("${path.module}/user-data.sh", {
    api_key               = var.api_key
    domain_name           = var.domain_name
    admin_email           = var.admin_email
    ollama_models         = jsonencode(var.ollama_models)
    ollama_num_parallel   = var.ollama_num_parallel
    ollama_max_loaded     = var.ollama_max_loaded
    ollama_keep_alive     = var.ollama_keep_alive
    environment           = var.environment
  })
}

# EC2 Instance (GPU)
resource "aws_instance" "ollama" {
  ami           = data.aws_ami.deep_learning_ubuntu.id
  instance_type = var.instance_type

  subnet_id                   = var.subnet_id != "" ? var.subnet_id : data.aws_subnets.public.ids[0]
  vpc_security_group_ids      = [aws_security_group.ollama.id]
  key_name                    = var.key_name
  iam_instance_profile        = aws_iam_instance_profile.ollama.name
  associate_public_ip_address = true

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size
    iops                  = var.root_volume_iops
    throughput            = var.root_volume_throughput
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "vipcontentai-ollama-${var.environment}-root"
    }
  }

  user_data                   = local.user_data
  user_data_replace_on_change = true

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring = var.enable_detailed_monitoring

  tags = {
    Name = "vipcontentai-ollama-${var.environment}"
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

# Elastic IP (optional, for stable public IP)
resource "aws_eip" "ollama" {
  count    = var.allocate_eip ? 1 : 0
  domain   = "vpc"
  instance = aws_instance.ollama.id

  tags = {
    Name = "vipcontentai-ollama-${var.environment}"
  }

  depends_on = [aws_instance.ollama]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ollama" {
  name              = "/aws/ec2/vipcontentai-ollama-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "vipcontentai-ollama-${var.environment}"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "vipcontentai-ollama-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    InstanceId = aws_instance.ollama.id
  }

  tags = {
    Name = "vipcontentai-ollama-${var.environment}-cpu"
  }
}

resource "aws_cloudwatch_metric_alarm" "status_check_failed" {
  alarm_name          = "vipcontentai-ollama-${var.environment}-status-check"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors EC2 status checks"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    InstanceId = aws_instance.ollama.id
  }

  tags = {
    Name = "vipcontentai-ollama-${var.environment}-status"
  }
}

# Route53 DNS record (optional)
resource "aws_route53_record" "ollama" {
  count   = var.route53_zone_id != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [var.allocate_eip ? aws_eip.ollama[0].public_ip : aws_instance.ollama.public_ip]
}

# Outputs
output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.ollama.id
}

output "instance_public_ip" {
  description = "Public IP address"
  value       = var.allocate_eip ? aws_eip.ollama[0].public_ip : aws_instance.ollama.public_ip
}

output "instance_private_ip" {
  description = "Private IP address"
  value       = aws_instance.ollama.private_ip
}

output "security_group_id" {
  description = "Security Group ID"
  value       = aws_security_group.ollama.id
}

output "ssh_command" {
  description = "SSH command to connect to instance"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${var.allocate_eip ? aws_eip.ollama[0].public_ip : aws_instance.ollama.public_ip}"
}

output "api_endpoint" {
  description = "API endpoint URL"
  value       = "https://${var.domain_name}/chat"
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group name"
  value       = aws_cloudwatch_log_group.ollama.name
}
