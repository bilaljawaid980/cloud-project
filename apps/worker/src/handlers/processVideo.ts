import { extractMetadata } from "../services/metadata";
import { generateThumbnail } from "../services/thumbnail";

export interface ProcessVideoMessage {
  videoId: string;
  objectKey: string;
  ownerId: string;
}

export const processVideo = async (message: ProcessVideoMessage): Promise<void> => {
  const metadata = await extractMetadata(message.videoId, message.objectKey);
  const thumbnail = await generateThumbnail(message.videoId, message.objectKey);

  console.log(
    JSON.stringify({
      level: "info",
      event: "process_video_complete",
      ownerId: message.ownerId,
      videoId: message.videoId,
      metadata,
      thumbnail
    })
  );
};
