import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

const metricsEnabled = process.env.CLOUDWATCH_METRICS_ENABLED === "true";
const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-southeast-1";
const namespace = process.env.CLOUDWATCH_NAMESPACE || "GreenCart/Operations";

const cloudWatchClient = metricsEnabled
  ? new CloudWatchClient({ region })
  : null;

const baseDimensions = [
  { Name: "Service", Value: "GreenCartApi" },
  { Name: "Environment", Value: process.env.NODE_ENV || "development" },
];

export const recordMetric = async (
  metricName,
  value,
  unit = "Count",
  dimensions = []
) => {
  if (!cloudWatchClient) return;

  const metricValue = Number(value);
  if (!Number.isFinite(metricValue)) return;

  const metricDimensions = [...baseDimensions, ...dimensions]
    .filter((dimension) => dimension?.Name && dimension.Value !== undefined)
    .map((dimension) => ({
      Name: dimension.Name,
      Value: String(dimension.Value),
    }));

  try {
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: [
          {
            MetricName: metricName,
            Unit: unit,
            Value: metricValue,
            Timestamp: new Date(),
            Dimensions: metricDimensions,
          },
        ],
      })
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        type: "cloudwatch_metric_error",
        metric_name: metricName,
        message: error.message,
        timestamp: new Date().toISOString(),
      })
    );
  }
};
