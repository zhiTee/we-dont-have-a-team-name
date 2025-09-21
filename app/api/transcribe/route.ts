import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const client = new TranscribeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });

    // Upload audio to S3
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
    });

    const bucketName = process.env.S3_BUCKET_NAME || "transcribe-audio-bucket";
    const fileName = `audio/${Date.now()}-${audioFile.name}`;
    const arrayBuffer = await audioFile.arrayBuffer();

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: audioFile.type,
    }));

    // Start transcription job
    const jobName = `transcribe-job-${Date.now()}`;
    const s3Uri = `s3://${bucketName}/${fileName}`;

    await client.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      Media: {
        MediaFileUri: s3Uri,
      },
      MediaFormat: "wav",
      LanguageCode: "en-US",
    }));

    // Poll for completion
    let jobStatus = "IN_PROGRESS";
    let transcription = "";
    
    while (jobStatus === "IN_PROGRESS") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const jobResult = await client.send(new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName,
      }));
      
      jobStatus = jobResult.TranscriptionJob?.TranscriptionJobStatus || "FAILED";
      
      if (jobStatus === "COMPLETED") {
        const transcriptUri = jobResult.TranscriptionJob?.Transcript?.TranscriptFileUri;
        if (transcriptUri) {
          const transcriptResponse = await fetch(transcriptUri);
          const transcriptData = await transcriptResponse.json();
          transcription = transcriptData.results.transcripts[0].transcript;
        }
      }
    }

    return NextResponse.json({ 
      transcription: transcription || "Transcription failed",
      jobName: jobName,
      status: jobStatus
    });
  } catch (error) {
    console.error('Transcribe error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}