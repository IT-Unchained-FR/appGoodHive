import { S3, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateFileKeyName } from "@/app/utils/generate-file-key-name";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || "",
    secretAccessKey: process.env.B2_APP_KEY || "",
  },
  endpoint: process.env.B2_ENDPOINT || "",
  region: process.env.B2_REGION || "",
  forcePathStyle: true, // For S3-compatible services
});

// Add middleware to intercept requests and remove the 'x-amz-checksum-crc32' header
s3.middlewareStack.add(
  (next) => async (args) => {
    console.log(args.request, "S3 Middleware ARG Request...");
    // Narrow the type of args.request
    if (
      typeof args.request === "object" &&
      args.request !== null &&
      "headers" in args.request
    ) {
      const requestWithHeaders = args.request as {
        headers: Record<string, string>;
      };
      console.log(requestWithHeaders, "S3 Request With Header...");

      delete requestWithHeaders.headers["x-amz-checksum-crc32"];
      delete requestWithHeaders.headers["x-amz-sdk-checksum-algorithm"];

      console.log(
        requestWithHeaders,
        "S3 Request With Header After Deleting...",
      );
    }
    return next(args);
  },
  {
    step: "build",
    priority: "low",
  },
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bucketName = process.env.B2_BUCKET || "";
    const fileType = file.type;
    const keyName = generateFileKeyName(fileType);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const putObjectParams = {
      Bucket: bucketName,
      Key: keyName,
      Body: buffer,
      ACL: "public-read" as const,
      ContentType: fileType,
    };

    console.log("PutObject Params:", putObjectParams);

    await s3.send(new PutObjectCommand(putObjectParams));

    const hostB2 = process.env.B2_HOST || "";
    const fileUrl = `https://${bucketName}.${hostB2}/${keyName}`;

    return NextResponse.json({ fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
