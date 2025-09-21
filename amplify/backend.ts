import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export const backend = defineBackend({
  data,
});

// Add custom IAM policies for AWS services
backend.addOutput({
  custom: {
    bedrockPolicy: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'bedrock:InvokeModel',
            'bedrock:RetrieveAndGenerate',
            'bedrock:Retrieve',
            's3:GetObject',
            's3:PutObject',
            'textract:AnalyzeDocument',
            'transcribe:StartTranscriptionJob',
            'transcribe:GetTranscriptionJob'
          ],
          Resource: '*'
        }
      ]
    }
  }
});