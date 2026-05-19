export interface ExtractedMetadata {
  durationMs: number;
  width: number;
  height: number;
}

export const extractMetadata = async (videoId: string, objectKey: string): Promise<ExtractedMetadata> => {
  console.log(
    JSON.stringify({
      level: "info",
      event: "extract_metadata_todo",
      videoId,
      objectKey
    })
  );

  return {
    durationMs: 0,
    width: 0,
    height: 0
  };
};
