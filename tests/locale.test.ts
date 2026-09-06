import { describe, it, expect } from "vitest";
import { translateUi } from "../src/locale";
describe("interface language", () => {
 it("localizes menus and recording controls", () => {
  expect(translateUi("Feedback · 提供意見", "zh")).toBe("提供意見");
  expect(translateUi("Pause (暂停)", "en")).toBe("Pause");
  expect(translateUi("Talk to me (说什么？)", "zh")).toBe("說什麼？");
 });
 it("preserves source text and translation data", () => {
  expect(translateUi("Please remember to shut off your TV.", "zh")).toBe("Please remember to shut off your TV.");
  expect(translateUi("請記得熄電視。", "en")).toBe("請記得熄電視。");
 });
});
