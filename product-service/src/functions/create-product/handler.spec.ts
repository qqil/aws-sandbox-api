import chai, { expect } from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { describe } from "mocha";
import { ProductService } from "@services/product.service";
import { main as createProduct } from "./handler";
import apiGatewayEvent from "src/mocks/api-gateway-event";

chai.use(sinonChai);

describe("Handler createProduct", () => {
  const sandbox = sinon.createSandbox();
  const env = {
    TABLE_PRODUCTS: "products",
    TABLE_STOCKS: "stocks",
  };

  beforeEach(() => {
    sandbox.stub(process, "env").value(env);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should create product", async () => {
    const productData = {
      title: "Test",
      description: "Desc",
      price: 20.55,
      stocks: 10,
    };
    const event = {
      ...apiGatewayEvent,
      httpMethod: "POST",
      body: JSON.stringify(productData),
      headers: {
        "Content-Type": "application/json",
      },
    };

    const storeStub = sandbox
      .stub(ProductService.prototype, "store")
      .resolves({ ...productData, id: "myid" });

    const response = await createProduct(event, null);
    const body = JSON.parse(response.body);

    expect(response.statusCode).to.be.equal(200);
    expect(storeStub).to.have.been.calledOnceWith(productData);
    expect(body.product.id).to.be.equal("myid");
  });

  it("should not pass validation", async () => {
    const productData = {
      description: "Desc",
      price: 20.55,
      stocks: 10,
    };
    const event = {
      ...apiGatewayEvent,
      httpMethod: "POST",
      body: JSON.stringify(productData),
      headers: {
        "Content-Type": "application/json",
      },
    };

    sandbox
      .stub(ProductService.prototype, "store")
      .resolves({ ...productData, title: "test", id: "myid" });

    const response = await createProduct(event, null);

    expect(response.statusCode).to.be.equal(400);
  });
});
