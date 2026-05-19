import { runCreateDemoUserCommand } from "./commands/createDemoUser";
import { runEstimateCostCommand } from "./commands/estimateCost";
import { runGenerateEnvExampleCommand } from "./commands/generateEnvExample";
import { runHealthCommand } from "./commands/health";
import { runListVideosCommand } from "./commands/listVideos";

const main = async (): Promise<void> => {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "health":
      await runHealthCommand(args);
      return;
    case "create-demo-user":
      await runCreateDemoUserCommand(args);
      return;
    case "list-videos":
      await runListVideosCommand(args);
      return;
    case "generate-env-example":
      runGenerateEnvExampleCommand();
      return;
    case "estimate-cost":
      runEstimateCostCommand(args);
      return;
    default:
      console.log("Usage: clipforge <health|create-demo-user|list-videos|generate-env-example|estimate-cost>");
  }
};

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
