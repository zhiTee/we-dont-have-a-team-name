import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, s3Bucket, s3Key } = await request.json();

    // If S3 document provided, use Textract first
    if (s3Bucket && s3Key) {
      const textractClient = new TextractClient({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const textractCommand = new AnalyzeDocumentCommand({
        Document: {
          S3Object: {
            Bucket: s3Bucket,
            Name: s3Key,
          },
        },
        FeatureTypes: ["TABLES", "FORMS"],
      });

      const textractResponse = await textractClient.send(textractCommand);
      const extractedText = textractResponse.Blocks?.filter(block => block.BlockType === "LINE")
        .map(block => block.Text).join("\n") || "";

      // Use extracted text with Mistral
      const client = new BedrockRuntimeClient({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const payload = {
        messages: [{
          role: "user",
          content: `Based on this document content: ${extractedText}\n\nQuestion: ${message}`
        }],
        max_tokens: 1000,
        temperature: 0.7
      };

      const command = new InvokeModelCommand({
        modelId: "amazon.nova-pro-v1:0",
        contentType: "application/json",
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return NextResponse.json({ 
        response: responseBody.output.message.content[0].text,
        mode: "textract-analysis",
        extractedText: extractedText.substring(0, 500) + "..."
      });
    }

    // Try Knowledge Base first
    try {
      const kbClient = new BedrockAgentRuntimeClient({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const kbCommand = new RetrieveAndGenerateCommand({
        input: {
          text: message,
        },
        retrieveAndGenerateConfiguration: {
          type: "KNOWLEDGE_BASE",
          knowledgeBaseConfiguration: {
            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID!,
            modelArn: `arn:aws:bedrock:${process.env.AWS_REGION}::foundation-model/amazon.nova-pro-v1:0`,
            orchestrationConfiguration: {
              promptTemplate: {
                textPromptTemplate: "You are a helpful assistant. Use the following context to answer the question.\n\nConversation History: $conversation_history$\n\nContext: $search_results$\n\nQuestion: $query$\n\n$output_format_instructions$\n\nAnswer:"
              }
            },
            generationConfiguration: {
              promptTemplate: {
                textPromptTemplate: "You are an expert at analyzing documents including tabular, structured and descriptive data. Based on the following context, answer the question. If the context contains tabular or descriptive data, state or describe them in your response without showing the structure.\n\nContext: $search_results$\n\nQuestion: $query$"
              }
            }
          },
        },
      });

      const kbResponse = await kbClient.send(kbCommand);
      
      // If Knowledge Base has relevant results, use it
      if (kbResponse.output?.text && kbResponse.citations && kbResponse.citations.length > 0) {
        return NextResponse.json({ 
          response: kbResponse.output.text,
          sources: kbResponse.citations.map((citation: any) => ({
            content: citation.generatedResponsePart?.textResponsePart?.text,
            source: citation.retrievedReferences?.[0]?.location?.s3Location?.uri
          })),
          mode: "knowledge-base"
        });
      }
    } catch (kbError) {
      console.log('Knowledge Base failed, falling back to regular chat:', kbError);
    }

    // Fallback to regular Mistral
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const payload = {
      messages: [{
        role: "user",
        content: message
      }],
      max_tokens: 1000,
      temperature: 0.7
    };

    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return NextResponse.json({ 
      response: responseBody.output.message.content[0].text,
      mode: "regular-chat"
    });
  } catch (error) {
    console.error('Bedrock error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}