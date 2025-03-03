variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Project name to prefix resource names."
  type        = string
  default     = "cryptosong"
}

variable "api_key" {
  description = "API key for the Lambda function"
  type        = string
}
