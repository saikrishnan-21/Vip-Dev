# VIPContentAI - AWS Ollama Variables

variable "aws_region" {
  description = "AWS region for deployment (us-east-1 or us-west-2 recommended for GPU availability)"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = contains(["us-east-1", "us-west-2", "us-east-2", "us-west-1"], var.aws_region)
    error_message = "Region must be a US region with GPU instance availability"
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "instance_type" {
  description = "EC2 instance type (g6.xlarge for L4, g6e.xlarge for L40S)"
  type        = string
  default     = "g6e.xlarge"

  validation {
    condition     = can(regex("^g[0-9]", var.instance_type))
    error_message = "Instance type must be a GPU instance (g-family)"
  }
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID (leave empty to use default VPC)"
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "Subnet ID (leave empty to use first public subnet)"
  type        = string
  default     = ""
}

variable "ssh_allowed_cidrs" {
  description = "List of CIDR blocks allowed to SSH"
  type        = list(string)
  default     = [] # Example: ["1.2.3.4/32"]

  validation {
    condition     = length(var.ssh_allowed_cidrs) > 0
    error_message = "At least one CIDR block must be specified for SSH access"
  }
}

variable "root_volume_size" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 300

  validation {
    condition     = var.root_volume_size >= 100 && var.root_volume_size <= 1000
    error_message = "Root volume size must be between 100 and 1000 GB"
  }
}

variable "root_volume_iops" {
  description = "Root EBS volume IOPS (gp3)"
  type        = number
  default     = 3000

  validation {
    condition     = var.root_volume_iops >= 3000 && var.root_volume_iops <= 16000
    error_message = "IOPS must be between 3000 and 16000"
  }
}

variable "root_volume_throughput" {
  description = "Root EBS volume throughput in MB/s (gp3)"
  type        = number
  default     = 125

  validation {
    condition     = var.root_volume_throughput >= 125 && var.root_volume_throughput <= 1000
    error_message = "Throughput must be between 125 and 1000 MB/s"
  }
}

variable "domain_name" {
  description = "Domain name for API endpoint (e.g., api.vipcontentai.com)"
  type        = string
}

variable "admin_email" {
  description = "Admin email for Let's Encrypt SSL certificates"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.admin_email))
    error_message = "Must be a valid email address"
  }
}

variable "api_key" {
  description = "API key for securing the Node.js endpoint (Bearer token)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.api_key) >= 32
    error_message = "API key must be at least 32 characters long"
  }
}

variable "ollama_models" {
  description = "List of Ollama models to pre-pull"
  type        = list(string)
  default = [
    "llama3.1:8b-instruct-q4_K_M",
    "mistral:7b-instruct-q4_K_M",
    "nomic-embed-text:latest"
  ]
}

variable "ollama_num_parallel" {
  description = "Number of parallel requests Ollama can handle"
  type        = number
  default     = 3

  validation {
    condition     = var.ollama_num_parallel >= 1 && var.ollama_num_parallel <= 10
    error_message = "Parallel requests must be between 1 and 10"
  }
}

variable "ollama_max_loaded" {
  description = "Maximum number of models loaded in memory simultaneously"
  type        = number
  default     = 3

  validation {
    condition     = var.ollama_max_loaded >= 1 && var.ollama_max_loaded <= 5
    error_message = "Max loaded models must be between 1 and 5"
  }
}

variable "ollama_keep_alive" {
  description = "Keep-alive duration for loaded models (e.g., 5m, 10m)"
  type        = string
  default     = "5m"

  validation {
    condition     = can(regex("^[0-9]+[mh]$", var.ollama_keep_alive))
    error_message = "Keep-alive must be in format like 5m or 1h"
  }
}

variable "allocate_eip" {
  description = "Whether to allocate an Elastic IP for stable public IP"
  type        = bool
  default     = true
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring (additional cost)"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch retention period"
  }
}

variable "route53_zone_id" {
  description = "Route53 Hosted Zone ID for automatic DNS record creation (optional)"
  type        = string
  default     = ""
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications (optional)"
  type        = string
  default     = ""
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
