import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

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
            modelArn: `arn:aws:bedrock:${process.env.AWS_REGION}::foundation-model/mistral.mistral-7b-instruct-v0:2`,
            orchestrationConfiguration: {
              promptTemplate: {
                textPromptTemplate: "You are a helpful assistant. Use the following context to answer the question.\n\nConversation History: $conversation_history$\n\nContext: $search_results$\n\nQuestion: $query$\n\n$output_format_instructions$\n\nAnswer:"
              }
            },
            generationConfiguration: {
              promptTemplate: {
                textPromptTemplate: "<s>[INST] Based on the following context, answer the question.\n\nContext: $search_results$\n\nQuestion: $query$ [/INST]"
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
      prompt: `<s>[INST] ${message} [/INST]`,
      max_tokens: 1000,
      temperature: 0.7
    };

    const command = new InvokeModelCommand({
      modelId: "mistral.mistral-7b-instruct-v0:2",
      contentType: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return NextResponse.json({ 
      response: responseBody.outputs[0].text,
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