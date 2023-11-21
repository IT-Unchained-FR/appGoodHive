import { S3, PutObjectCommand, GetObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import { generateFileKeyName } from "@/app/utils/generate-file-key-name";

export async function POST(request: Request) {
  try {
    const file = await request.json();

    const s3 = new S3({
      credentials: {
        accessKeyId: process.env.B2_KEY_ID || "",
        secretAccessKey: process.env.B2_APP_KEY || "",
      },
      endpoint: process.env.B2_ENDPOINT || "",
      region: process.env.B2_REGION || "",
    });

    const bucketName = process.env.B2_BUCKET || "";
    const keyName = generateFileKeyName(file.type);
    const dataBuffer = Buffer.from(file.data);

    const putObjectParams = {
      Bucket: bucketName,
      Key: keyName,
      Body: dataBuffer,
      ACL: ObjectCannedACL.public_read,
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

      return new Response(JSON.stringify({ fileUrl: url }));
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
}
