import { describe, expect, it } from "vitest";
import { ms, ta } from "../src/extraLocales";
import { photoZh } from "../src/photoLocale";
import { translateUi } from "../src/locale";
describe("Malay and Tamil interface", () => {
 it("covers every photo interface message", () => { for (const key of Object.keys(photoZh)) { expect(ms[key], key).toBeDefined(); expect(ta[key], key).toBeDefined(); } });
 it("switches feedback and errors without changing source text", () => { expect(translateUi("Feedback · 提供意見", "ms")).toBe("Maklum balas"); expect(translateUi("Stop (结束)", "ta")).toBe("நிறுத்து"); expect(translateUi("Please remember to shut off your TV.", "ta")).toBe("Please remember to shut off your TV."); });
});
