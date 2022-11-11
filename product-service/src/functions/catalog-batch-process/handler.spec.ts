import { ProductService } from "@services/product.service";
import { SQSEvent } from "aws-lambda";
import chai, { expect } from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { CreateProduct } from "src/schemas/create-product";
import { main as catalogBatchProcess } from "./handler";
import { SNSClient } from "@aws-sdk/client-sns";
import { v4 } from "uuid";
import { Product, productSchema } from "src/schemas/product";
import chaiAsPromised from "chai-as-promised";
import { ValidationError } from "yup";

chai.use(sinonChai);
chai.use(chaiAsPromised);

const asEventRecord = (productData: CreateProduct) => {
  return {
    messageId: "",
    receiptHandle: "",
    body: JSON.stringify(productData),
    attributes: {
      ApproximateReceiveCount: "",
      SentTimestamp: "",
      SenderId: "",
      ApproximateFirstReceiveTimestamp: "",
    },
    messageAttributes: {},
    md5OfBody: "",
    eventSource: "",
    eventSourceARN: "",
    awsRegion: "",
  };
};

describe("Handler catalogBatchProcess", () => {
  const sandbox = sinon.createSandbox();
  const env = {
    TABLE_PRODUCTS: "products",
    TABLE_STOCKS: "stocks",
    SNS_PRODUCT_CREATED_TOPIC_ARN: "sns-test-topic-arn",
  };

  beforeEach(() => {
    sandbox.stub(process, "env").value(env);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should create products", async () => {
    const productsData: CreateProduct[] = [
      {
        title: "Test",
        description: "Description",
        price: 15.55,
        stocks: 10,
      },
      {
        title: "Test2",
        description: "Description2",
        price: 10.0,
        stocks: 0,
      },
    ];

    const event: SQSEvent = {
      Records: productsData.map(asEventRecord),
    };

    const products: Product[] = productsData.map((p) =>
      productSchema.cast({ ...p, id: v4() })
    );

    const snsClientSendStub = sandbox
      .stub(SNSClient.prototype, "send")
      .resolves();

    const putBatchStub = sandbox
      .stub(ProductService.prototype, "putBatch")
      .resolves(products);

    await catalogBatchProcess(event);

    expect(putBatchStub).to.be.calledOnce;
    expect(putBatchStub.getCall(0)).to.be.calledWith(productsData);
    expect(snsClientSendStub).to.be.calledOnce;
    expect(snsClientSendStub.getCall(0).args[0].input).to.be.deep.equal({
      TopicArn: env.SNS_PRODUCT_CREATED_TOPIC_ARN,
      Subject: `ImportService: products batch processed.`,
      Message: JSON.stringify(products),
      MessageAttributes: {
        hasEmptyStocks: {
          DataType: "String",
          StringValue: "true",
        },
      },
    });
  });

  it("should not pass validation", async () => {
    const productsData: CreateProduct[] = [
      {
        title: "",
        description: "Description",
        price: 15.55,
        stocks: 10,
      },
      {
        title: "Test2",
        description: "Description2",
        price: 10.0,
        stocks: 0,
      },
    ];

    const event: SQSEvent = {
      Records: productsData.map(asEventRecord),
    };

    const snsClientSendStub = sandbox
      .stub(SNSClient.prototype, "send")
      .resolves();

    const putBatchStub = sandbox
      .stub(ProductService.prototype, "putBatch")
      .resolves(
        productsData.map((p) => productSchema.cast({ ...p, id: v4() }))
      );

    const catalogBatchProcessPromise = catalogBatchProcess(event);

    await expect(catalogBatchProcessPromise).to.be.rejectedWith(
      ValidationError
    );
    expect(putBatchStub).not.to.be.called;
    expect(snsClientSendStub).not.to.be.called;
  });
});
