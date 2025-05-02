# S3 Copy example

TypeScript example for S3 copy

## Testing with localstack

Start localstack

```
docker run \
  --rm -it \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  localstack/localstack
```

In a new terminal create a large file

```
truncate -s 1G bigfile_1G.data
```

Create the buckets

```
aws --endpoint-url=http://localhost:4566 s3 mb s3://test-bucket-a
aws --endpoint-url=http://localhost:4566 s3 mb s3://test-bucket-b
```

Upload the large file

```
aws --endpoint-url=http://localhost:4566 s3 cp bigfile_1G.data s3://test-bucket-a
```

Start the application

```
spin build --up
```

Run the test

```
curl localhost:3000/stream/bigfile_1G.data
```
