import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import "dotenv/config";
import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import connectCloudinary from "./configs/cloudinary.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { stripeWebhooks } from "./controllers/orderController.js";
import { recordMetric } from "./configs/cloudwatch.js";

const app = express();
const port = process.env.PORT || 4000;

const parseOrigins = (...values) =>
  values
    .flatMap((value) => (value || "").split(","))
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "https://bahuan-greencart.vercel.app",
  ...parseOrigins(
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS,
    process.env.CORS_ORIGINS
  ),
];

app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

await connectDB();
await connectCloudinary();

//Middleware configuration
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const path = req.originalUrl.split("?")[0];
    const statusClass = `${Math.floor(res.statusCode / 100)}xx`;

    console.log(
      JSON.stringify({
        type: "request",
        method: req.method,
        path,
        status: res.statusCode,
        status_class: statusClass,
        duration_ms: Number(durationMs.toFixed(2)),
        timestamp: new Date().toISOString(),
      })
    );

    void recordMetric("ApiLatencyMs", durationMs, "Milliseconds", [
      { Name: "Method", Value: req.method },
      { Name: "Path", Value: path },
      { Name: "StatusClass", Value: statusClass },
    ]);

    if (res.statusCode >= 500) {
      void recordMetric("Api5xxCount", 1, "Count", [
        { Name: "Method", Value: req.method },
        { Name: "Path", Value: path },
      ]);
    }
  });

  next();
});

app.get("/", (req, res) => res.send("API is working"));
app.get("/health", (req, res) =>
  res.status(200).json({
    status: "ok",
    service: "greencart-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
);
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
