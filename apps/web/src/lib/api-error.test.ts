import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "./api-error";

describe("apiErrorMessage", () => {
  it("returns the API message when Axios exposes one", () => {
    expect(
      apiErrorMessage(
        {
          isAxiosError: true,
          response: { data: { error: { message: "Mensagem da API" } } },
          toJSON: () => ({}),
        },
        "Fallback",
      ),
    ).toBe("Mensagem da API");
  });

  it("uses the fallback for unknown errors and incomplete API responses", () => {
    expect(apiErrorMessage(new Error("falha"), "Fallback")).toBe("Fallback");
    expect(apiErrorMessage({ isAxiosError: true, toJSON: () => ({}) }, "Fallback")).toBe(
      "Fallback",
    );
  });
});
