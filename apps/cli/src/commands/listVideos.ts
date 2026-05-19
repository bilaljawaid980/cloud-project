const getArgValue = (args: string[], flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const pad = (value: string, length: number): string => value.padEnd(length, " ");

export const runListVideosCommand = async (args: string[]): Promise<void> => {
  const token = getArgValue(args, "--token") ?? process.env.TOKEN;
  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

  if (!token) {
    throw new Error("Missing required --token argument or TOKEN environment variable.");
  }

  const response = await fetch(`${apiBaseUrl}/videos`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`list-videos failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    videos: Array<{
      videoId: string;
      title: string;
      status: string;
      visibility: string;
      createdAt: string;
    }>;
  };

  console.log(
    `${pad("id", 24)} | ${pad("title", 24)} | ${pad("status", 10)} | ${pad("visibility", 10)} | created`
  );
  for (const video of payload.videos) {
    console.log(
      `${pad(video.videoId, 24)} | ${pad(video.title.slice(0, 24), 24)} | ${pad(video.status, 10)} | ${pad(video.visibility, 10)} | ${video.createdAt}`
    );
  }
};
