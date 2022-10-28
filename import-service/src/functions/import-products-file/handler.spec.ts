import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import chai, { expect } from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import apiGatewayEvent from "src/mocks/api-gateway-event";
import presignResponse from "src/mocks/presign-response";
import { main as importProductsFile } from "./handler";

chai.use(sinonChai);

describe("Handler importProductsFile", () => {
  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    sandbox.restore();
  });

  it("should return presigned url", async () => {
    const event = {
      ...apiGatewayEvent,
      httpMethod: "GET",
      queryStringParameters: {
        name: "test",
      },
    };
    const env = {
      BUCKET_NAME: "test-bucket",
      UPLOAD_DIR: "upload",
    };

    sandbox.stub(process, "env").value(env);
    const presignerStub = sandbox
      .stub(S3RequestPresigner.prototype, "presign")
      .resolves({
        ...presignResponse,
        protocol: "https:",
        path: "upload/test",
        hostname: "testhost",
      });

    const response = await importProductsFile(event, null);
    const body = JSON.parse(response.body);
    const signedUrl = new URL(body.signedUrl);

    expect(signedUrl.pathname).to.be.equal("/upload/test");
    expect(signedUrl.hostname).to.be.equal("testhost");
    expect(presignerStub).to.be.calledOnce;
  });

  it("should return 400", async () => {
    const event = {
      ...apiGatewayEvent,
      httpMethod: "GET",
      queryStringParameters: {
        name: "",
      },
    };
    const env = {
      BUCKET_NAME: "test-bucket",
      UPLOAD_DIR: "upload",
    };

    sandbox.stub(process, "env").value(env);

    const response = await importProductsFile(event, null);

    expect(response.statusCode).to.be.equal(400);
  });
});