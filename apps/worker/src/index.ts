import { processVideo, type ProcessVideoMessage } from "./handlers/processVideo";

interface SQSMessage {
  messageId: string;
  body: string;
}

interface SQSEvent {
  Records: SQSMessage[];
}

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body) as ProcessVideoMessage;
    await processVideo(message);
  }
};
