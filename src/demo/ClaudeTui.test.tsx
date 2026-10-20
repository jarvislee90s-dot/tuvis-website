import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import "@/i18n"; // 侧效应导入：ClaudeTui 的 useTranslation 需要全局 i18next 资源
import { ClaudeTui } from "./ClaudeTui";
import { COPY as D1_COPY } from "./scenes/D1Scene";
import { COPY as REMOTE_COPY } from "./scenes/RemoteScene";
import type { Bilingual } from "./types";

/** toast 双语契约（B3-T8）：body 为 Bilingual（types.ts），ClaudeTui 渲染处按 lang 取。
 *  两条输入与调用方同构——zh/en 双支同源各自场景 COPY（D1Scene「tuvis-app · 等待批准」、
 *  RemoteScene「远程审批 · 空闲」），标题为语言无关产品名 Claude。 */
const D1_TOAST: Bilingual = { zh: D1_COPY.zh.toastBody, en: D1_COPY.en.toastBody };
const REMOTE_TOAST: Bilingual = { zh: REMOTE_COPY.zh.toastBody, en: REMOTE_COPY.en.toastBody };

/** useLang 从 /:lang 取语言，挂到路由下（Brand.test 先例） */
function mountAt(entry: string, el: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/:lang" element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ClaudeTui toast：双语契约按 lang 取（B3-T8）", () => {
  afterEach(cleanup);

  it("/zh 取 zh 支：两条 toast 均显中文正文", () => {
    const { container } = mountAt("/zh", (
      <>
        <ClaudeTui toast={{ title: "Claude", body: D1_TOAST }} />
        <ClaudeTui toast={{ title: "Claude", body: REMOTE_TOAST }} />
      </>
    ));
    expect(container.textContent).toContain("tuvis-app · 等待批准");
    expect(container.textContent).toContain("远程审批 · 空闲");
    expect(container.textContent).not.toContain("awaiting approval");
  });

  it("/en 取 en 支：两条 toast 均显英文正文，且不残留中文", () => {
    const { container } = mountAt("/en", (
      <>
        <ClaudeTui toast={{ title: "Claude", body: D1_TOAST }} />
        <ClaudeTui toast={{ title: "Claude", body: REMOTE_TOAST }} />
      </>
    ));
    expect(container.textContent).toContain("tuvis-app · awaiting approval");
    expect(container.textContent).toContain("Remote approval · idle");
    expect(container.textContent).not.toContain("等待批准");
    expect(container.textContent).not.toContain("空闲");
  });

  it("不传 toast 时不渲染通知卡（null 分支）", () => {
    const { container } = mountAt("/en", <ClaudeTui />);
    /* 断 toast 正文整句（默认回复里本就有「1 awaiting approval」，不能用尾词断言） */
    expect(container.textContent).not.toContain("tuvis-app · awaiting approval");
    expect(container.textContent).not.toContain("Remote approval · idle");
  });
});
