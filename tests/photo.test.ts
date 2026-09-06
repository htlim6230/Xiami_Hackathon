import { afterEach, describe, expect, it, vi } from "vitest";
import { translatePhoto } from "../src/photoService";
afterEach(() => vi.useRealTimers());
describe("static photo pipeline", () => {
 it("returns the confirmed sample in the selected target", async () => { vi.useFakeTimers(); const p = translatePhoto({sample:true,target:"yue",scenario:"success",signal:new AbortController().signal}); await vi.runAllTimersAsync(); expect((await p).translated).toContain("巴士轉車站"); });
 it.each(["timeout", "unreadable"] as const)("reports %s", async scenario => { vi.useFakeTimers(); const p = translatePhoto({sample:true,target:"zh",scenario,signal:new AbortController().signal}); const check = expect(p).rejects.toThrow(scenario === "timeout" ? "TIMEOUT" : "UNREADABLE"); await vi.runAllTimersAsync(); await check; });
 it("never presents sample output as OCR of an uploaded photo", async () => { vi.useFakeTimers(); const p = translatePhoto({sample:false,target:"zh",scenario:"success",signal:new AbortController().signal}); const check = expect(p).rejects.toThrow("PROVIDER_REQUIRED"); await vi.runAllTimersAsync(); await check; });
 it("labels Hokkien output as a Mandarin fallback", async () => { vi.useFakeTimers(); const p = translatePhoto({sample:true,target:"nan",scenario:"success",signal:new AbortController().signal}); await vi.runAllTimersAsync(); const result = await p; expect(result.fallback).toBe(true); expect(result.speechLanguage).toBe("zh-TW"); });
 it("cancels work when the user navigates away", async () => { vi.useFakeTimers(); const controller = new AbortController(); const p = translatePhoto({sample:true,target:"zh",scenario:"success",signal:controller.signal}); const check = expect(p).rejects.toMatchObject({name:"AbortError"}); controller.abort(); await check; expect(vi.getTimerCount()).toBe(0); });
});

