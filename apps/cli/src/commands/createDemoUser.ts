const getArgValue = (args: string[], flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

export const runCreateDemoUserCommand = async (args: string[]): Promise<void> => {
  const email = getArgValue(args, "--email");
  const name = getArgValue(args, "--name");
  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

  if (!email) {
    throw new Error("Missing required --email argument.");
  }

  const response = await fetch(`${apiBaseUrl}/auth/dev-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, name })
  });

  if (!response.ok) {
    throw new Error(`create-demo-user failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    userId: string;
    token: string;
    expiresAt: string;
  };

  console.log(`userId: ${payload.userId}`);
  console.log(`token: ${payload.token.slice(0, 20)}...`);
  console.log(`expiresAt: ${payload.expiresAt}`);
};
