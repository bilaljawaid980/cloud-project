const getArgValue = (args: string[], flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

export const runHealthCommand = async (args: string[]): Promise<void> => {
  const apiBaseUrl = getArgValue(args, "--url") ?? process.env.API_BASE_URL ?? "http://localhost:3000";
  const response = await fetch(`${apiBaseUrl}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  const payload = await response.json();
  console.log(JSON.stringify(payload, null, 2));
};
