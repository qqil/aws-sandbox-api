import chai, { expect } from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import { ProductService } from "src/services/product.service";
import { Product } from "src/types/product";
import { main as getProductsList } from "./handler";

chai.use(sinonChai);

describe("Handler getProductsList", () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.restore();
  });

  it("should return product list and status code 200", async () => {
    const event = {
      httpMethod: "GET",
    };

    const getAllStub = sandbox
      .stub(ProductService.prototype, "getAll")
      .returns(
        new Promise((resolve) =>
          resolve([{ id: "1" }, { id: "2" }] as Product[])
        )
      );

    const response = await getProductsList(event, null);
    const { products } = JSON.parse(response.body);

    expect(response.statusCode).to.be.equal(200);
    expect(products.length).to.be.equal(2);
    expect(getAllStub).to.have.been.calledOnce;
  });

  it("should return 404", async () => {
    const event = {
      httpMethod: "GET",
    };

    const getAllStub = sandbox
      .stub(ProductService.prototype, "getAll")
      .returns(new Promise((resolve) => resolve(undefined)));

    const response = await getProductsList(event, null);

    expect(response.statusCode).to.be.equal(404);
    expect(getAllStub).to.have.been.calledOnce;
  });
});
