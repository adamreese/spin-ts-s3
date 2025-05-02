import { S3Client, GetObjectCommand, ListBucketsCommand, ListObjectsV2Command, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, } from "@aws-sdk/client-s3";
import { Variables } from "@fermyon/spin-sdk";
import { AutoRouter as Router } from "itty-router";
import { Readable } from "stream";

let router = Router();

router.get('/stream/:file', async ({ file }) => {

  let client = new S3Client({
    region: Variables.get("region")!,
    endpoint: Variables.get("endpoint")!,
    credentials: {
      accessKeyId: Variables.get("access_key_id")!,
      secretAccessKey: Variables.get("secret_access_key")!,
    },
  });

  const sourceBucket = "lds-test-bucket-a"
  const destinationBucket = "lds-test-bucket-b"

  let getObjectResponse = await client.send(
    new GetObjectCommand({
      Bucket: sourceBucket,
      Key: file,
    }));

  const sourceStream = getObjectResponse.Body as ReadableStream;

  if (!sourceStream) throw new Error("Unable to get source object stream");

  const createUploadResp = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: destinationBucket,
      Key: file,
    })
  );

  const uploadId = createUploadResp.UploadId;
  if (!uploadId) throw new Error("Failed to initiate multipart upload");

  console.log("Multipart upload started:", uploadId);

  const parts: { PartNumber: number; ETag: string }[] = [];

  let partNumber = 1;
  let buffer = Buffer.alloc(0);
  const partSize = 5 * 1024 * 1024;

  let reader = sourceStream.getReader();

  while ( true) {
    const {done, value} = await reader.read()
    if (done) break;

    buffer = Buffer.concat([buffer, value]);

    while (buffer.length >= partSize) {
      const partBuffer = buffer.slice(0, partSize);
      buffer = buffer.slice(partSize);

      const uploadPartResp = await client.send(
        new UploadPartCommand({
          Bucket: destinationBucket,
          Key: file,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: partBuffer,
        })
      );

      console.log(`Uploaded part ${partNumber}`);
      parts.push({ PartNumber: partNumber, ETag: uploadPartResp.ETag! });
      partNumber++;
    }
  }

  // Upload the remaining buffer
  if (buffer.length > 0) {
    const uploadPartResp = await client.send(
      new UploadPartCommand({
        Bucket: destinationBucket,
        Key: file,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: buffer,
      })
    );
    console.log(`Uploaded final part ${partNumber}`);
    parts.push({ PartNumber: partNumber, ETag: uploadPartResp.ETag! });
  }

  // Complete multipart upload
  const completeResp = await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: destinationBucket,
      Key: file,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
  );

  console.log("Multipart upload complete:", completeResp.Location);

  return new Response("done")
})

router.get('/list/:bucket', async ({ bucket }) => {
  let client = new S3Client({
    endpoint: Variables.get("endpoint")!,
    region: Variables.get("region")!,
    credentials: {
      accessKeyId: Variables.get("access_key_id")!,
      secretAccessKey: Variables.get("secret_access_key")!,
    },
  });

  let data = await client.send(new ListObjectsV2Command({
    Bucket: bucket,
  }));
  console.log(JSON.stringify(data.Contents, null, 2));

  return new Response("done")
})

router.get('/buckets', async ({ }) => {
  let client = new S3Client({
    endpoint: Variables.get("endpoint")!,
    region: Variables.get("region")!,
    credentials: {
      accessKeyId: Variables.get("access_key_id")!,
      secretAccessKey: Variables.get("secret_access_key")!,
    },
  });

  let data = await client.send(new ListBucketsCommand({}));
  console.log(JSON.stringify(data, null, 2));

  return new Response("done")
})

//@ts-ignore
addEventListener('fetch', async (event: FetchEvent) => {
  event.respondWith(router.fetch(event.request));
});
