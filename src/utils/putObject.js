import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3-credentials.js"
export async function putObject(file, fileName) {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: 'audio/mpeg,mp3',
    };
    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command);
    if(data.$metadata.httpStatusCode !== 200) {
      throw new Error('Failed to upload file to S3');
    }
    let url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    console.log('File uploaded successfully. URL:', url);
    return { url, key: params.Key };
  } catch (error) {
    console.error('Error putting object:', error);
    throw error;
  }
}