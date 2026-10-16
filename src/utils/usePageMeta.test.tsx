import { useEffect, useState } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { usePageMeta } from "./usePageMeta";

// jsdom 不加载 index.html，head 里没有 meta[name=description]——每用例复位
function resetHead() {
  document.title = "";
  document.head
    .querySelectorAll('meta[name="description"]')
    .forEach((el) => el.remove());
}

function Page({ title, description }: { title: string; description: string }) {
  usePageMeta({ title, description });
  return <main>page</main>;
}

/** 挂真实路由再渲染页面组件：路由上下文是四页面组件体的实际运行环境 */
function renderPage(ui: React.ReactElement) {
  const router = createMemoryRouter([{ path: "*", element: ui }]);
  render(<RouterProvider router={router} />);
}

describe("usePageMeta（双语页签：document.title + meta description）", () => {
  afterEach(cleanup);

  it("meta 标签缺失时创建并写入 title 与 description", () => {
    resetHead();
    expect(document.querySelector('meta[name="description"]')).toBeNull();

    renderPage(<Page title="首页标题" description="首页描述" />);

    expect(document.title).toBe("首页标题");
    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute("content")).toBe("首页描述");
  });

  it("meta 标签已存在时只改 content 不新建（生产 index.html 恒有，防御分支）", () => {
    resetHead();
    const existing = document.createElement("meta");
    existing.setAttribute("name", "description");
    existing.setAttribute("content", "旧描述");
    document.head.appendChild(existing);

    renderPage(<Page title="新标题" description="新描述" />);

    expect(document.title).toBe("新标题");
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(existing.getAttribute("content")).toBe("新描述");
  });

  it("重渲染传新值（语言切换后页面重渲）时 title 与 description 同步更新", async () => {
    resetHead();
    // 挂载一拍后自动切值，模拟「切语言 → 页面带新 props 重渲染」
    function Switchable() {
      const [zh, setZh] = useState(true);
      useEffect(() => {
        const timer = setTimeout(() => setZh(false), 20);
        return () => clearTimeout(timer);
      }, []);
      return zh ? (
        <Page title="中文标题" description="中文描述" />
      ) : (
        <Page title="English Title" description="English description" />
      );
    }

    renderPage(<Switchable />);

    // 初帧中文（timer 未到，同步断言确定性成立）
    expect(document.title).toBe("中文标题");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "中文描述",
    );

    await waitFor(() => expect(document.title).toBe("English Title"));
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "English description",
    );
  });
});
