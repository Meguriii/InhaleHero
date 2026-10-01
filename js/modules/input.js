// ============================================================
// 输入模块 — 键盘 / 鼠标 / 触控 / 网页方向键 事件处理
// ============================================================

import {
  movePlayer,
  restartLevel,
  loadLevel,
  undo
} from './gameController.js';

import {
  currentLevelIdx,
  levels
} from './gameState.js';

import { getGameCanvas } from './canvas.js';

import {
  isEditing,
  editCell,
  getEditTileSize,
  isTestMode,
  returnToEditor
} from './editor.js';

import {
  dismissOverlays,
  renderLevelGrid,
  showScreen
} from './ui.js';


// ============================================================
// 键盘映射
// ============================================================

/**
 * @type {Object<string, [number, number]>}
 *
 * [dr, dc]
 *
 * dr = 行方向
 * dc = 列方向
 */
const KEY_MAP = {
  'ArrowUp': [-1, 0],
  'ArrowDown': [1, 0],
  'ArrowLeft': [0, -1],
  'ArrowRight': [0, 1],

  'w': [-1, 0],
  's': [1, 0],
  'a': [0, -1],
  'd': [0, 1],
};


// ============================================================
// 键盘输入
// ============================================================

export function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    const ctrl = e.ctrlKey || e.metaKey;

    // --------------------------------------------------------
    // Ctrl + Z
    // --------------------------------------------------------
    if (ctrl && key === 'z') {
      e.preventDefault();
      restartLevel();
      return;
    }

    // --------------------------------------------------------
    // 方向键 / WASD
    // --------------------------------------------------------
    const dir = KEY_MAP[key];

    if (dir && !ctrl) {
      e.preventDefault();

      if (isEditing()) return;

      const [dr, dc] = dir;

      movePlayer(dr, dc);
      return;
    }

    // --------------------------------------------------------
    // 数字键 1~4：选择角色
    // --------------------------------------------------------
    if (key >= '1' && key <= '4') {
      const idx = parseInt(key, 10) - 1;

      const btn = document.querySelector(
        `.char-btn[data-char="${idx}"]`
      );

      if (btn && !btn.classList.contains('disabled')) {
        btn.click();
      }

      return;
    }

    // --------------------------------------------------------
    // 空格 / Enter：处理覆盖层
    // --------------------------------------------------------
    if (key === ' ' || key === 'Enter') {
      const victory = document.getElementById('victoryOverlay');
      const death = document.getElementById('deathOverlay');

      if (victory && victory.classList.contains('show')) {
        e.preventDefault();

        const nextBtn = document.getElementById('victoryNextBtn');

        if (nextBtn && nextBtn.style.display !== 'none') {
          nextBtn.click();
        } else {
          dismissOverlays();
          loadLevel(currentLevelIdx);
        }

        return;
      }

      if (death && death.classList.contains('show')) {
        e.preventDefault();

        const restartBtn =
          document.getElementById('deathRestartBtn');

        if (restartBtn) {
          restartBtn.click();
        }

        return;
      }
    }

    // --------------------------------------------------------
    // Q / Tab：切换角色
    // --------------------------------------------------------
    if (key === 'Tab' || key === 'q') {
      e.preventDefault();

      const switchBtn =
        document.getElementById('switchBtn');

      if (switchBtn) {
        switchBtn.click();
      }

      return;
    }

    // --------------------------------------------------------
    // R：重置关卡
    // --------------------------------------------------------
    if (key === 'r' && !ctrl) {
      e.preventDefault();

      const restartBtn =
        document.getElementById('restartBtn');

      if (restartBtn) {
        restartBtn.click();
      }

      return;
    }

    // --------------------------------------------------------
    // Z：打开关卡选择
    // --------------------------------------------------------
    if (key === 'z' && !ctrl) {
      e.preventDefault();

      renderLevelGrid();
      showScreen('selectScreen');

      return;
    }

    // --------------------------------------------------------
    // E：撤销
    // --------------------------------------------------------
    if (key === 'e' && !ctrl) {
      e.preventDefault();

      undo();

      return;
    }

    // --------------------------------------------------------
    // C：进入编辑器 / 从测试模式返回
    // --------------------------------------------------------
    if (key === 'c' && !ctrl) {
      e.preventDefault();

      if (isTestMode()) {
        returnToEditor();
      } else {
        const editBtn =
          document.getElementById('editToolBtn');

        if (editBtn) {
          editBtn.click();
        }
      }

      return;
    }
  });
}


// ============================================================
// 网页十字方向键
// ============================================================

/**
 * 初始化网页上的十字方向键。
 *
 * HTML：
 *
 * .d-up
 * .d-down
 * .d-left
 * .d-right
 *
 * 与键盘方向键使用完全相同的 movePlayer()。
 */
export function setupDpad() {
  const dpadMap = {
    '.d-up': [-1, 0],
    '.d-down': [1, 0],
    '.d-left': [0, -1],
    '.d-right': [0, 1],
  };

  for (const [selector, [dr, dc]] of Object.entries(dpadMap)) {
    const button = document.querySelector(selector);

    if (!button) {
      console.warn(
        `[D-Pad] 找不到按钮：${selector}`
      );
      continue;
    }

    // --------------------------------------------------------
    // pointerdown 同时支持：
    // 鼠标
    // 触摸屏
    // 触控笔
    // --------------------------------------------------------
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();

      // 编辑器模式下不允许使用游戏方向键
      if (isEditing()) {
        return;
      }

      // 如果存在覆盖层，也不执行移动
      const victory =
        document.getElementById('victoryOverlay');

      const death =
        document.getElementById('deathOverlay');

      if (
        victory &&
        victory.classList.contains('show')
      ) {
        return;
      }

      if (
        death &&
        death.classList.contains('show')
      ) {
        return;
      }

      // 执行移动
      movePlayer(dr, dc);
    });

    // 防止移动端浏览器产生额外的 click 行为
    button.addEventListener('click', (e) => {
      e.preventDefault();
    });

    // 防止长按选择文字 / 图片等浏览器默认行为
    button.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
}


// ============================================================
// Canvas 鼠标 / 触控输入
// 用于关卡编辑器绘制
// ============================================================

export function setupCanvasInput() {
  const { canvas } = getGameCanvas();

  let drawing = false;

  /**
   * 根据鼠标 / 触摸坐标计算所在格子。
   *
   * @param {number} clientX
   * @param {number} clientY
   * @returns {{row: number, col: number}}
   */
  const getTilePos = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // 编辑器实际 tile size
    // 游戏模式 fallback 到 48
    const ts = getEditTileSize() || 48;

    return {
      row: Math.floor(y / ts),
      col: Math.floor(x / ts),
    };
  };


  // ----------------------------------------------------------
  // 鼠标按下
  // ----------------------------------------------------------

  canvas.addEventListener('mousedown', (e) => {
    if (!isEditing()) return;

    drawing = true;

    const { row, col } =
      getTilePos(e.clientX, e.clientY);

    editCell(row, col);
  });


  // ----------------------------------------------------------
  // 鼠标移动
  // ----------------------------------------------------------

  canvas.addEventListener('mousemove', (e) => {
    if (!drawing || !isEditing()) return;

    const { row, col } =
      getTilePos(e.clientX, e.clientY);

    editCell(row, col);
  });


  // ----------------------------------------------------------
  // 鼠标释放
  // ----------------------------------------------------------

  canvas.addEventListener('mouseup', () => {
    drawing = false;
  });


  // ----------------------------------------------------------
  // 鼠标离开 Canvas
  // ----------------------------------------------------------

  canvas.addEventListener('mouseleave', () => {
    drawing = false;
  });


  // ----------------------------------------------------------
  // 触控开始
  // ----------------------------------------------------------

  canvas.addEventListener(
    'touchstart',
    (e) => {
      if (!isEditing()) return;

      e.preventDefault();

      drawing = true;

      const touch = e.touches[0];

      const { row, col } =
        getTilePos(
          touch.clientX,
          touch.clientY
        );

      editCell(row, col);
    },
    { passive: false }
  );


  // ----------------------------------------------------------
  // 触控移动
  // ----------------------------------------------------------

  canvas.addEventListener(
    'touchmove',
    (e) => {
      if (!drawing || !isEditing()) return;

      e.preventDefault();

      const touch = e.touches[0];

      const { row, col } =
        getTilePos(
          touch.clientX,
          touch.clientY
        );

      editCell(row, col);
    },
    { passive: false }
  );


  // ----------------------------------------------------------
  // 触控结束
  // ----------------------------------------------------------

  canvas.addEventListener('touchend', () => {
    drawing = false;
  });
}