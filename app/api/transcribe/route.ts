import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const whisperEndpoint = process.env.WHISPER_EC2_ENDPOINT;
    
    if (!whisperEndpoint) {
      return NextResponse.json({ error: "Whisper endpoint not configured" }, { status: 500 });
    }

    // Send audio to Whisper EC2 instance
    const whisperFormData = new FormData();
    whisperFormData.append('audio', audioFile);

    const response = await fetch(`${whisperEndpoint}/transcribe`, {
      method: 'POST',
      body: whisperFormData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({ 
      transcription: result.text || result.transcription,
      jobName: `whisper-job-${Date.now()}`,
      status: "COMPLETED"
    });
  } catch (error) {
    console.error('Whisper transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}