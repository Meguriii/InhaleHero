// ============================================================
// 主入口 — 初始化所有模块，启动游戏
// ============================================================

import {
  initCanvas,
  getGameCanvas
} from './canvas.js';

import {
  initRenderer
} from './renderer.js';

import {
  loadLevels,
  levels
} from './gameState.js';

import {
  loadLevel,
  updateFrame
} from './gameController.js';

import {
  initUI,
  setupCharacterButtons,
  setupUndoButton,
  setupSwitchButton,
  setupRestartButtons,
  setupNextLevelButton,
  setupLevelSelect
} from './ui.js';

import {
  setupEditorButtons
} from './editor.js';

import {
  setupKeyboard,
  setupCanvasInput,
  setupDpad
} from './input.js';


// ============================================================
// 初始化游戏
// ============================================================

async function initGame() {

  // ----------------------------------------------------------
  // 1. 初始化 Canvas
  // ----------------------------------------------------------

  initCanvas();

  const { ctx } = getGameCanvas();


  // ----------------------------------------------------------
  // 2. 初始化渲染器
  // ----------------------------------------------------------

  initRenderer(ctx);


  // ----------------------------------------------------------
  // 3. 加载关卡数据
  // ----------------------------------------------------------

  await loadLevels();


  // ----------------------------------------------------------
  // 4. 初始化 UI
  // ----------------------------------------------------------

  initUI();

  setupCharacterButtons();

  setupUndoButton();

  setupSwitchButton();

  setupRestartButtons();

  setupNextLevelButton();

  setupLevelSelect();


  // ----------------------------------------------------------
  // 5. 初始化编辑器
  // ----------------------------------------------------------

  setupEditorButtons();


  // ----------------------------------------------------------
  // 6. 初始化输入
  // ----------------------------------------------------------

  // 键盘方向键 / WASD
  setupKeyboard();

  // Canvas 编辑器输入
  setupCanvasInput();

  // 网页十字方向键
  setupDpad();


  // ----------------------------------------------------------
  // 7. 加载初始关卡
  // ----------------------------------------------------------

  if (levels && levels.length > 0) {
    loadLevel(0);
  }


  // ----------------------------------------------------------
  // 8. 启动游戏主循环
  // ----------------------------------------------------------

  let lastTime = performance.now();

  /**
   * 游戏主循环
   *
   * @param {DOMHighResTimeStamp} time
   */
  function gameLoop(time) {

    const delta = time - lastTime;

    if (delta >= 100) {
      updateFrame();

      lastTime = time;
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}


// ============================================================
// 等待 DOM 加载完成
// ============================================================

if (document.readyState === 'loading') {

  document.addEventListener(
    'DOMContentLoaded',
    initGame
  );

} else {

  initGame();
}