# AWS IAM Setup for DapurGenie

## Required IAM Policy

Create an IAM policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/amazon.nova-pro-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:RetrieveAndGenerate",
        "bedrock:Retrieve"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::stt-voice-bucket-1/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeDocument"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob"
      ],
      "Resource": "*"
    }
  ]
}
```

## Amplify Service Role

1. Go to AWS IAM Console
2. Create Role → AWS Service → Amplify
3. Attach the policy above
4. Name: `AmplifyDapurGenieRole`

## Environment Variables

Set these in Amplify Console:
- `AWS_REGION=us-east-1`
- `KNOWLEDGE_BASE_ID=QO3NVHHHZV`
- `S3_BUCKET_NAME=stt-voice-bucket-1`