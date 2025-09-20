# F&B Customer Support Chatbot

An AI-powered customer support chatbot for Food & Beverage retail businesses, built with Next.js, LangChain, and AWS Bedrock.

## Features

- **AI Chat Interface**: Real-time conversation with Mistral 7B model via AWS Bedrock
- **RAG (Retrieval Augmented Generation)**: Searches FAQ knowledge base for accurate responses
- **Conversation Memory**: Maintains chat history using LangChain
- **Quick Actions**: Pre-built buttons for common F&B queries (Hours, Menu, Orders, Refunds)
- **Responsive UI**: Modern chat interface built with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI/ML**: AWS Bedrock (Mistral 7B), LangChain
- **UI Components**: Radix UI, shadcn/ui, Lucide React
- **Styling**: Tailwind CSS with custom animations

## Project Structure

```
├── app/
│   ├── api/bedrock/route.ts    # LangChain + Bedrock API endpoint
│   ├── page.tsx                # Main chat page
│   └── layout.tsx              # Root layout
├── components/
│   ├── ui/                     # Reusable UI components
│   └── chat.tsx                # Main chat interface
├── lib/utils.ts                # Utility functions
├── faq.json                    # FAQ knowledge base
└── .env.local                  # AWS credentials
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure AWS Credentials
Create `.env.local` with your AWS credentials:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 3. Customize FAQ Knowledge Base
Edit `faq.json` with your business-specific information:
```json
[
  {
    "question": "What are your opening hours?",
    "answer": "We're open Monday-Sunday 8AM-10PM. Drive-thru available 24/7."
  }
]
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the chatbot.

## How It Works

### Chat Flow
1. **User Input** → Chat component captures message
2. **FAQ Search** → RAG system searches knowledge base for relevant answers
3. **AI Processing** → LangChain sends context + history to Bedrock Mistral model
4. **Response** → AI generates response using FAQ context and conversation history
5. **Display** → Response appears in chat interface

### Key Components

- **`/api/bedrock/route.ts`**: LangChain integration with AWS Bedrock
- **`components/chat.tsx`**: Chat UI with message history and quick actions
- **`faq.json`**: Searchable knowledge base for accurate responses

## AWS Requirements

- AWS account with Bedrock access
- Mistral 7B model enabled in your AWS region
- IAM user with Bedrock permissions

## Customization

### Add More FAQ Items
Expand `faq.json` with your business information:
- Menu items and pricing
- Store locations and hours
- Policies and procedures
- Promotions and offers

### Modify Quick Actions
Edit the quick action buttons in `components/chat.tsx`:
```tsx
{["Hours", "Menu", "Order Status", "Refund"].map((action) => (
  // Add your custom actions here
))}
```

### Change AI Model
Update the model in `app/api/bedrock/route.ts`:
```tsx
model: "anthropic.claude-3-sonnet-20240229-v1:0" // or other Bedrock models
```

## Deployment

Deploy on Vercel:
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Future Enhancements

- **Order Tracking**: Integrate with POS systems
- **Menu Search**: Vector search through menu items
- **Store Locator**: Find nearest locations
- **Streaming Responses**: Real-time AI response streaming
- **Multi-language Support**: Internationalization