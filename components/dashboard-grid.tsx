"use client";

import type {
  GridStackOptions,
  GridStack as GridStackType,
  GridStackWidget,
} from "gridstack";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "dashboard-grid-layout";
const ROOT_STYLE: CSSProperties = { padding: 16 };
const TOOLBAR_STYLE: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginBottom: 12,
};
const STATUS_STYLE: CSSProperties = { opacity: 0.7 };
const GRID_INIT_OPTIONS = { margin: 8, cellHeight: 80, float: true };
const DEFAULT_LAYOUT: GridStackWidget[] = [
  { id: "a", x: 0, y: 0, w: 4, h: 2, content: "A" },
  { id: "b", x: 4, y: 0, w: 4, h: 2, content: "B" },
  { id: "c", x: 8, y: 0, w: 4, h: 2, content: "C" },
];

type StatusListener = (status: string) => void;

function isGridStackWidgetArray(
  layout: GridStackWidget[] | GridStackOptions,
): layout is GridStackWidget[] {
  return Array.isArray(layout);
}

class GridLayoutStorage {
  constructor(private readonly key: string) {}

  load(): GridStackWidget[] | null {
    const saved = localStorage.getItem(this.key);
    if (!saved) {
      console.log("Load saved: 保存済みレイアウトが見つかりません");
      return null;
    }

    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        console.log("Load saved: 保存済みレイアウトの形式が不正です");
        return null;
      }
      return parsed as GridStackWidget[];
    } catch (error) {
      console.log("Load saved: 保存済みレイアウトの読み込みに失敗", error);
      return null;
    }
  }

  save(layout: GridStackWidget[]) {
    localStorage.setItem(this.key, JSON.stringify(layout));
    console.log("Save: レイアウトを保存しました");
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}

class GridController {
  private grid: GridStackType | null = null;

  constructor(
    private readonly storage: GridLayoutStorage,
    private readonly defaultLayout: GridStackWidget[],
    private readonly onStatusChange: StatusListener,
  ) {}

  attach(grid: GridStackType) {
    this.grid = grid;

    if (!this.loadSavedLayout()) {
      this.loadDefaultLayout();
    }

    grid.on("added removed change", () => {
      this.onStatusChange("changed");
    });

    this.onStatusChange("ready");
  }

  destroy() {
    const grid = this.grid;
    if (!grid) {
      return;
    }

    grid.off("added removed change");
    grid.destroy(false);
    this.grid = null;
  }

  addWidget() {
    const grid = this.getGridOrLog("Add widget");
    if (!grid) {
      return;
    }

    const wasAnimationEnabled = grid.opts.animate !== false;
    if (wasAnimationEnabled) {
      grid.setAnimation(false);
    }

    try {
      const widgetId = `widget-${Date.now()}`;
      grid.addWidget({
        id: widgetId,
        w: 3,
        h: 2,
        content: widgetId,
      });
      console.log("Add widget: ウィジェットを追加しました");
      this.onStatusChange("added widget");
    } finally {
      if (wasAnimationEnabled) {
        window.requestAnimationFrame(() => {
          if (this.grid === grid) {
            grid.setAnimation(true);
          }
        });
      }
    }
  }

  saveLayout() {
    const grid = this.getGridOrLog("Save");
    if (!grid) {
      return;
    }

    const layout = grid.save();
    if (!isGridStackWidgetArray(layout)) {
      console.log("Save: 保存形式が GridStackWidget[] ではありません");
      return;
    }

    this.storage.save(layout);
    this.onStatusChange("saved");
  }

  loadLayout() {
    if (this.loadSavedLayout()) {
      this.onStatusChange("loaded");
      return;
    }

    this.loadDefaultLayout();
    this.onStatusChange("loaded default");
  }

  resetLayout() {
    const grid = this.getGridOrLog("Reset");
    if (!grid) {
      return;
    }

    this.storage.clear();
    this.applyLayout(grid, this.defaultLayout);
    console.log("Reset: レイアウトをリセットしました");
    this.onStatusChange("reset");
  }

  private getGridOrLog(action: string) {
    if (!this.grid) {
      console.log(
        `${action}: グリッドがまだ初期化されていないため無視されました`,
      );
      return null;
    }
    return this.grid;
  }

  private loadSavedLayout(): boolean {
    const grid = this.getGridOrLog("Load");
    if (!grid) {
      return false;
    }

    const layout = this.storage.load();
    if (!layout) {
      return false;
    }

    this.applyLayout(grid, layout);
    console.log("Load saved: 保存済みレイアウトを読み込み");
    return true;
  }

  private loadDefaultLayout() {
    const grid = this.getGridOrLog("Load default");
    if (!grid) {
      return;
    }

    this.applyLayout(grid, this.defaultLayout);
    console.log("Load default: デフォルトレイアウトを読み込み");
  }

  private applyLayout(grid: GridStackType, layout: GridStackWidget[]) {
    grid.removeAll();
    grid.load(layout);
  }
}

function logGridElement(gridElement: HTMLDivElement | null) {
  console.log("Log grid element: gridElementRef.current =", gridElement);
}

export default function DashboardGrid() {
  const gridElementRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<string>("not initialized");
  const controllerRef = useRef<GridController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new GridController(
      new GridLayoutStorage(STORAGE_KEY),
      DEFAULT_LAYOUT,
      setStatus,
    );
  }

  useEffect(() => {
    let disposed = false;
    console.log("useEffect: グリッド初期化開始");
    const controller = controllerRef.current;

    void (async () => {
      if (!gridElementRef.current) {
        console.log("useEffect: gridElementRef.current がまだないためスキップ");
        return;
      }

      const { GridStack } = await import("gridstack");
      if (disposed) {
        console.log("useEffect: クリーンアップ済みのため初期化中止");
        return;
      }

      const grid = GridStack.init(GRID_INIT_OPTIONS, gridElementRef.current);
      console.log("useEffect: グリッド初期化完了");
      controller?.attach(grid);
      console.log("useEffect: 準備完了");
    })();

    return () => {
      disposed = true;
      controller?.destroy();
      console.log("useEffect: クリーンアップ（グリッド破棄）");
    };
  }, []);

  return (
    <div style={ROOT_STYLE}>
      <div style={TOOLBAR_STYLE}>
        <button
          type="button"
          onClick={() => controllerRef.current?.addWidget()}
        >
          Add widget
        </button>
        <button
          type="button"
          onClick={() => controllerRef.current?.saveLayout()}
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => controllerRef.current?.loadLayout()}
        >
          Load
        </button>
        <button
          type="button"
          onClick={() => controllerRef.current?.resetLayout()}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => logGridElement(gridElementRef.current)}
        >
          Log grid element
        </button>
        <span style={STATUS_STYLE}>status: {status}</span>
      </div>

      {/* GridStack ルート要素（CSS class 必須） */}
      <div className="grid-stack" ref={gridElementRef} />
    </div>
  );
}
