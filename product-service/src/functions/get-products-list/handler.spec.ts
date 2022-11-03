import chai, { expect } from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import apiGatewayEvent from "src/mocks/api-gateway-event";
import { Product } from "src/schemas/product";
import { ProductService } from "src/services/product.service";
import { main as getProductsList } from "./handler";

chai.use(sinonChai);

describe("Handler getProductsList", () => {
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

  it("should return product list and status code 200", async () => {
    const event = {
      ...apiGatewayEvent,
      httpMethod: "GET",
    };

    const getAllStub = sandbox
      .stub(ProductService.prototype, "getAll")
      .resolves([{ id: "1" }, { id: "2" }] as Product[]);

    const response = await getProductsList(event, null);
    const { products } = JSON.parse(response.body);

    expect(response.statusCode).to.be.equal(200);
    expect(products.length).to.be.equal(2);
    expect(getAllStub).to.have.been.calledOnce;
  });

  it("should return 404", async () => {
    const event = {
      ...apiGatewayEvent,
      httpMethod: "GET",
    };

    const getAllStub = sandbox
      .stub(ProductService.prototype, "getAll")
      .resolves(undefined);

    const response = await getProductsList(event, null);

    expect(response.statusCode).to.be.equal(404);
    expect(getAllStub).to.have.been.calledOnce;
  });
});
