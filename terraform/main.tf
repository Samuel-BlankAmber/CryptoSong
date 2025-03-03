terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.89.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7.0"
    }
  }
  required_version = ">= 1.11.0"
}

provider "aws" {
  region = var.aws_region
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../backend/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}

resource "aws_iam_role" "lambda_exec_role" {
  name = "${var.project_name}_lambda_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement: [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
    }],
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_layer_version" "ffmpeg_layer" {
  filename   = "${path.module}/ffmpeg.zip"
  layer_name = "${var.project_name}_ffmpeg_layer"
  compatible_runtimes = ["python3.13"]
  source_code_hash = filebase64sha256("${path.module}/ffmpeg.zip")
}

resource "aws_lambda_function" "lambda_function" {
  function_name    = "${var.project_name}_function"
  filename         = data.archive_file.lambda_zip.output_path
  runtime          = "python3.13"
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.lambda_exec_role.arn
  layers           = [aws_lambda_layer_version.ffmpeg_layer.arn]

  environment {
    variables = {
      API_KEY = var.api_key
    }
  }
}

resource "aws_lambda_function_url" "lambda_function_url" {
  function_name = aws_lambda_function.lambda_function.function_name
  authorization_type = "NONE"
}

output "lambda_function_url" {
  value = aws_lambda_function_url.lambda_function_url.function_url
}
