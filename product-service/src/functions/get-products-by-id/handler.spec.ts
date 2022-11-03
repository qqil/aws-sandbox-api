import chai, { expect } from "chai";
import { main as getProductsById } from "./handler";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { ProductService } from "../../services/product.service";
import { Product } from "../../types/product";
import apiGatewayEvent from "src/mocks/api-gateway-event";

chai.use(sinonChai);

describe("Handler getProductsById", () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.restore();
  });

  it("should return product and status code 200", async () => {
    const event = {
      ...apiGatewayEvent,
      httpMethod: "GET",
      pathParameters: {
        productId: "108",
      },
    };

    const getByIdStub = sandbox
      .stub(ProductService.prototype, "getById")
      .resolves({ id: event.pathParameters.productId } as Product);

    const response = await getProductsById(event, null);
    const { product } = JSON.parse(response.body);

    expect(response.statusCode).to.be.equal(200);
    expect(product.id).to.be.equal(event.pathParameters.productId);
    expect(getByIdStub).to.have.been.calledWith(event.pathParameters.productId);
  });

  it("should return 404", async () => {
    const event = {
      ...apiGatewayEvent,
      httpMethod: "GET",
      pathParameters: {
        productId: "0",
      },
    };

    const getByIdStub = sandbox
      .stub(ProductService.prototype, "getById")
      .resolves(undefined);

    const response = await getProductsById(event, null);

    expect(response.statusCode).to.be.equal(404);
    expect(getByIdStub).to.be.calledWith(event.pathParameters.productId);
  });
});
