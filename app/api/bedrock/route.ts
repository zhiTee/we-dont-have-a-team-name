import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest, NextResponse } from "next/server";
import { parseAIResponseToHTML } from "@/lib/html-parser";

export async function POST(request: NextRequest) {
  try {
    const { message, language = 'en' } = await request.json();
    
    const languageInstructions = {
      en: "You must respond only in English. Do not use any other language.",
      ms: "Anda mesti menjawab dalam Bahasa Malaysia sahaja. Jangan gunakan bahasa lain.",
      zh: "你必须只用中文回答。不要使用任何其他语言。请用简体中文或繁体中文回答。"
    };
    
    const instruction = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en;

    // Mock response for demo when AWS credentials are not available
    const mockResponses = {
      en: `Hello! I'm DapurGenie, your 24/7 F&B assistant.

## Our Services

* **Menu Information**: Detailed descriptions and prices
* **Allergen Details**: Complete allergen information for all dishes
* **Halal Status**: Certified halal options clearly marked
* **Operating Hours**: Real-time availability status
* **Delivery Options**: Multiple delivery partners available

## Sample Menu

| Dish | Price | Allergens | Halal |
|------|-------|-----------|-------|
| Nasi Lemak | RM 8.50 | Nuts, Eggs | ✓ |
| Curry Laksa | RM 12.00 | Shellfish, Gluten | ✓ |
| Char Kway Teow | RM 10.50 | Eggs, Soy | ✓ |

What would you like to know more about?`,
      ms: `Halo! Saya DapurGenie, pembantu F&B 24/7 anda.

## Perkhidmatan Kami

* **Maklumat Menu**: Penerangan lengkap dan harga
* **Butiran Alergen**: Maklumat alergen lengkap untuk semua hidangan
* **Status Halal**: Pilihan halal bertauliah ditanda dengan jelas
* **Waktu Operasi**: Status ketersediaan masa nyata
* **Pilihan Penghantaran**: Pelbagai rakan kongsi penghantaran tersedia

## Contoh Menu

| Hidangan | Harga | Alergen | Halal |
|----------|-------|---------|-------|
| Nasi Lemak | RM 8.50 | Kacang, Telur | ✓ |
| Laksa Kari | RM 12.00 | Kerang, Gluten | ✓ |
| Char Kway Teow | RM 10.50 | Telur, Soya | ✓ |

Apa yang ingin anda ketahui lebih lanjut?`,
      zh: `您好！我是DapurGenie，您的24/7餐饮助手。

## 我们的服务

* **菜单信息**: 详细描述和价格
* **过敏原详情**: 所有菜品的完整过敏原信息
* **清真状态**: 认证清真选项清楚标记
* **营业时间**: 实时可用状态
* **配送选项**: 多个配送合作伙伴可选

## 示例菜单

| 菜品 | 价格 | 过敏原 | 清真 |
|------|------|--------|------|
| 椰浆饭 | RM 8.50 | 坚果, 鸡蛋 | ✓ |
| 咖喱叻沙 | RM 12.00 | 贝类, 麸质 | ✓ |
| 炒粿条 | RM 10.50 | 鸡蛋, 大豆 | ✓ |

您想了解更多什么信息？`
    };

    // Try Knowledge Base first (only if configured)
    if (process.env.KNOWLEDGE_BASE_ID) {
      try {
        const kbClient = new BedrockAgentRuntimeClient({
          region: process.env.AWS_REGION || "us-east-1",
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
                textPromptTemplate: `You are a helpful assistant. ${instruction} IMPORTANT: Your entire response must be in the specified language only. Use the following context to answer the question.\n\nConversation History: $conversation_history$\n\nContext: $search_results$\n\nQuestion: $query$\n\n$output_format_instructions$\n\nAnswer:`
              }
            },
            generationConfiguration: {
              promptTemplate: {
                textPromptTemplate: `${instruction} CRITICAL: Your complete response must be in the specified language. Based on the following context, answer the question.\n\nContext: $search_results$\n\nQuestion: $query$`
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
          htmlResponse: parseAIResponseToHTML(kbResponse.output.text),
          mode: "knowledge-base"
        });
      }
      } catch (kbError) {
        console.log('Knowledge Base failed, falling back to regular chat:', kbError);
      }
    }

    // Fallback to regular Mistral
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      })
    });

    const payload = {
      prompt: `<s>[INST] ${instruction} CRITICAL: Your entire response must be in the specified language only. Question: ${message} [/INST]`,
      max_tokens: 2000,
      temperature: 0.5
    };

    const command = new InvokeModelCommand({
      modelId: "mistral.mistral-7b-instruct-v0:2",
      contentType: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const aiResponse = responseBody.outputs[0].text;
    return NextResponse.json({ 
      response: aiResponse,
      htmlResponse: parseAIResponseToHTML(aiResponse),
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