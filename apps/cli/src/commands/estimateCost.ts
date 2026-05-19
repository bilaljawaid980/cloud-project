const getNumericArg = (args: string[], flag: string): number => {
  const index = args.indexOf(flag);
  if (index < 0 || !args[index + 1]) {
    return 0;
  }

  return Number(args[index + 1]);
};

const pad = (value: string, width: number): string => value.padEnd(width, " ");

const currency = (value: number): string => `$${value.toFixed(2)}`;

export const runEstimateCostCommand = (args: string[]): void => {
  const storageGb = getNumericArg(args, "--storage-gb");
  const egressGb = getNumericArg(args, "--egress-gb");
  const apiRequests = getNumericArg(args, "--api-requests");
  const putRequests = getNumericArg(args, "--put-requests");
  const ddbReads = getNumericArg(args, "--ddb-reads");
  const ddbWrites = getNumericArg(args, "--ddb-writes");

  const s3StorageCost = storageGb * 0.023;
  const s3PutCost = (putRequests / 1000) * 0.005;
  const cloudfrontCost = egressGb * 0.0085;
  const dynamoWriteCost = (ddbWrites / 1_000_000) * 1.25;
  const dynamoReadCost = (ddbReads / 1_000_000) * 0.25;
  const lambdaCost = 0;
  const total = s3StorageCost + s3PutCost + cloudfrontCost + dynamoWriteCost + dynamoReadCost + lambdaCost;

  console.log(`${pad("Category", 24)} | ${pad("Usage", 16)} | Estimate`);
  console.log(`${pad("S3 storage", 24)} | ${pad(`${storageGb} GB`, 16)} | ${currency(s3StorageCost)}`);
  console.log(`${pad("S3 PUT", 24)} | ${pad(String(putRequests), 16)} | ${currency(s3PutCost)}`);
  console.log(`${pad("CloudFront egress", 24)} | ${pad(`${egressGb} GB`, 16)} | ${currency(cloudfrontCost)}`);
  console.log(`${pad("DynamoDB reads", 24)} | ${pad(String(ddbReads), 16)} | ${currency(dynamoReadCost)}`);
  console.log(`${pad("DynamoDB writes", 24)} | ${pad(String(ddbWrites), 16)} | ${currency(dynamoWriteCost)}`);
  console.log(`${pad("Lambda/API compute", 24)} | ${pad(String(apiRequests), 16)} | ${currency(lambdaCost)}`);
  console.log(`${pad("Total", 24)} | ${pad("-", 16)} | ${currency(total)}`);
  console.log("These are rough estimates. Actual costs may vary.");
};
