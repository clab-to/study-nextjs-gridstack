"use client";

import type { GridStack as GridStackType, GridStackWidget } from "gridstack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "dashboard-grid-layout";

export default function DashboardGrid() {
	const gridElementRef = useRef<HTMLDivElement | null>(null);
	const gridRef = useRef<GridStackType | null>(null);

	// グリッドの初期化
	const defaultLayout: GridStackWidget[] = useMemo(
		() => [
			{ id: "a", x: 0, y: 0, w: 4, h: 2, content: "A" },
			{ id: "b", x: 4, y: 0, w: 4, h: 2, content: "B" },
			{ id: "c", x: 8, y: 0, w: 4, h: 2, content: "C" },
		],
		[],
	);

	const [status, setStatus] = useState<string>("not initialized");

	const loadSavedLayout = useCallback((grid: GridStackType) => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) {
			console.log("Load saved: 保存済みレイアウトが見つかりません");
			return false;
		}

		try {
			const layout = JSON.parse(saved) as GridStackWidget[];
			grid.removeAll();
			grid.load(layout);
			console.log("Load saved: 保存済みレイアウトを読み込み");
			return true;
		} catch (error) {
			console.log("Load saved: 保存済みレイアウトの読み込みに失敗", error);
			return false;
		}
	}, []);

	const loadDefaultLayout = useCallback(
		(grid: GridStackType) => {
			grid.removeAll();
			grid.load(defaultLayout);
			console.log("Load default: デフォルトレイアウトを読み込み");
		},
		[defaultLayout],
	);

	useEffect(() => {
		let disposed = false;
		console.log("useEffect: グリッド初期化開始");

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

			const grid = GridStack.init(
				{ margin: 8, cellHeight: 80, float: true },
				gridElementRef.current,
			);
			gridRef.current = grid;
			console.log("useEffect: グリッド初期化完了");

			if (!loadSavedLayout(grid)) {
				loadDefaultLayout(grid);
			}

			grid.on("added removed change", () => {
				setStatus("changed");
			});

			setStatus("ready");
			console.log("useEffect: 準備完了");
		})();

		return () => {
			disposed = true;
			gridRef.current?.destroy(false);
			gridRef.current = null;
			console.log("useEffect: クリーンアップ（グリッド破棄）");
		};
	}, [loadDefaultLayout, loadSavedLayout]);

	const addWidget = () => {
		const grid = gridRef.current;
		if (!grid) {
			console.log(
				"Add widget: グリッドがまだ初期化されていないため無視されました",
			);
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
			setStatus("added widget");
		} finally {
			if (wasAnimationEnabled) {
				window.requestAnimationFrame(() => {
					if (gridRef.current === grid) {
						grid.setAnimation(true);
					}
				});
			}
		}
	};

	const saveLayout = () => {
		const grid = gridRef.current;
		if (!grid) {
			console.log("Save: グリッドがまだ初期化されていないため無視されました");
			return;
		}

		const layout = grid.save();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
		console.log("Save: レイアウトを保存しました");
		setStatus("saved");
	};

	const loadLayout = () => {
		const grid = gridRef.current;
		if (!grid) {
			console.log("Load: グリッドがまだ初期化されていないため無視されました");
			return;
		}

		if (loadSavedLayout(grid)) {
			setStatus("loaded");
		} else {
			loadDefaultLayout(grid);
			setStatus("loaded default");
		}
	};

	const resetLayout = () => {
		const grid = gridRef.current;
		if (!grid) {
			console.log("Reset: グリッドがまだ初期化されていないため無視されました");
			return;
		}

		localStorage.removeItem(STORAGE_KEY);
		loadDefaultLayout(grid);
		console.log("Reset: レイアウトをリセットしました");
		setStatus("reset");
	};

	const logGridElement = () => {
		console.log(
			"Log grid element: gridElementRef.current =",
			gridElementRef.current,
		);
	};

	return (
		<div style={{ padding: 16 }}>
			<div
				style={{
					display: "flex",
					gap: 8,
					alignItems: "center",
					marginBottom: 12,
				}}
			>
				<button onClick={addWidget}>Add widget</button>
				<button onClick={saveLayout}>Save</button>
				<button onClick={loadLayout}>Load</button>
				<button onClick={resetLayout}>Reset</button>
				<button onClick={logGridElement}>Log grid element</button>
				<span style={{ opacity: 0.7 }}>status: {status}</span>
			</div>

			{/* GridStack ルート要素（CSS class 必須） [oai_citation:11‡Gridstack.js Official Site](https://gridstackjs.com/doc/html/classes/GridStack.html) */}
			<div className="grid-stack" ref={gridElementRef} />
		</div>
	);
}
