export interface GeneratedThumbnail {
  key: string;
  generated: boolean;
}

export const generateThumbnail = async (videoId: string, objectKey: string): Promise<GeneratedThumbnail> => {
  console.log(
    JSON.stringify({
      level: "info",
      event: "generate_thumbnail_todo",
      videoId,
      objectKey
    })
  );

  return {
    key: `thumbnails/${videoId}.jpg`,
    generated: false
  };
};
