import { test, expect } from "@playwright/test";
import { login } from "./login";

test.describe("Account security page", () => {
  test("Check linked accounts available", async ({ page }) => {
    await login(page, "jdoe", "jdoe", "photoz");
    await page.getByRole("button", { name: "Account security" }).click();
    await expect(
      page.getByTestId("account-security/linked-accounts"),
    ).toHaveText("Linked accounts");
  });
});