export interface AudioChunk {
  data: Buffer;
  timestamp: number;
}

export interface TranscriptSegment {
  text: string;
  timestamp: number;
}

export interface TTSResponse {
  audio: Buffer;
  duration: number;
}
