import { NextRequest, NextResponse } from "next/server";

import { S3, PutObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import { generateFileKeyName } from "@/app/utils/generate-file-key-name";

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || "",
    secretAccessKey: process.env.B2_APP_KEY || "",
  },
  endpoint: process.env.B2_ENDPOINT || "",
  region: process.env.B2_REGION || "",
});

export async function POST(request: NextRequest) {
  try {
    // Extract the file from the FormData payload
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
      ACL: ObjectCannedACL.public_read,
      ContentType: fileType,
    };

    // Upload the file to the S3 bucket
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
