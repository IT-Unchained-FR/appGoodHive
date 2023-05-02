const fs = require("fs");

const {
  S3,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { v4: uuidv4 } = require("uuid");

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

    // Upload a new file to the bucket
    const keyName = "image_" + uuidv4() + ".jpg";

    const putObjectParams = {
      Bucket: bucketName,
      Key: keyName,
      Body: Buffer.from(file.data), // or fs.readFileSync(file) if reading from file system
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

    try {
      await s3.send(new GetObjectCommand(getObjectParams));
      const url = `https://${bucketName}.s3.us-east-005.backblazeb2.com/${keyName}`;
      return new Response(JSON.stringify({ imageUrl: url }));
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
}
