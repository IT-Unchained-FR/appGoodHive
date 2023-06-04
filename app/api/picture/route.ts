import { S3, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const file = await request.json();

    // Set credentials
    const s3 = new S3({
      credentials: {
        accessKeyId: process.env.B2_KEY_ID || "",
        secretAccessKey: process.env.B2_APP_KEY || "",
      },
      endpoint: process.env.B2_ENDPOINT || "",
      region: process.env.B2_REGION || "",
    });

    // Use the existing bucket
    const bucketName = process.env.B2_BUCKET || "";

    // Extract file extension
    const fileExtension = file.type.split("/")[1];

    // Upload a new file to the bucket with the file extension
    const keyName = `image_${uuidv4()}.${fileExtension}`;

    // Remove header
    const base64Data = file.data.replace(/^data:image\/\w+;base64,/, "");

    // Convert base64 to a buffer
    const dataBuffer = Buffer.from(base64Data, "base64");

    const putObjectParams = {
      Bucket: bucketName,
      Key: keyName,
      Body: dataBuffer,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: file.type,
    };

    try {
      await s3.send(new PutObjectCommand(putObjectParams));

      console.log("Successfully uploaded data to", bucketName + "/" + keyName);
    } catch (error) {
      console.error(error);
    }

    const getObjectParams = {
      Bucket: bucketName,
      Key: keyName,
    };

    const hostB2 = process.env.B2_HOST || "";

    try {
      await s3.send(new GetObjectCommand(getObjectParams));

      const url = `https://${bucketName}.${hostB2}/${keyName}`;

      return new Response(JSON.stringify({ imageUrl: url }));
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
}
