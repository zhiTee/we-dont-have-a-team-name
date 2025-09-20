import { ChatBedrockConverse } from "@langchain/aws";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    const model = new ChatBedrockConverse({
      model: "mistral.mistral-7b-instruct-v0:2",
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      maxTokens: 1000,
      temperature: 0.7,
    });

    // System prompt for F&B customer support
    const systemPrompt = `You are a helpful customer support assistant for a food & beverage retail business. 
Provide accurate, friendly responses about menu items, orders, hours, policies, and services. 
Keep responses concise and helpful. If you don't know something, direct customers to contact support.`;

    // Convert history to LangChain messages
    const messages = [
      new HumanMessage(systemPrompt),
      ...history.map((msg: any) => 
        msg.role === "user" 
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
      new HumanMessage(message),
    ];

    const response = await model.invoke(messages);
    
    return NextResponse.json({ response: response.content });
  } catch (error) {
    console.error('LangChain Bedrock error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}