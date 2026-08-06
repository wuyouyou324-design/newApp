/**
 * js/main.js
 * Root entry point orchestrating game state synchronization, AI schedules, UI screens,
 * save/load persistence triggers, and synthesizers.
 */

import { ChessGame } from './game.js';
import { ChessUI } from './ui.js';
import { ChessAI } from './ai.js';
import { StorageManager } from './storage.js';
import { audio } from './audio.js';

class ChessAppController {
  constructor() {
    this.game = new ChessGame();
    this.ui = new ChessUI(this.game, this);

    // Default configuration attributes
    this.gameMode = 'pvp'; // 'pvp' or 'pve'
    this.aiDifficulty = 1; // 1, 2, or 3
    this.playerColor = 'white'; // 'white', 'black', or 'random'
    this.actualPlayerColor = 'w'; // 'w' or 'b' derived from configuration

    this.isAIThinking = false;

    this.initDOMBindings();
    this.loadApplicationState();
  }

  initDOMBindings() {
    // 1. Screens switching bindings
    document.getElementById('btn-pvp').addEventListener('click', () => {
      audio.playButtonClick();
      this.promptOrStartNewGame('pvp');
    });

    document.getElementById('btn-pve-menu').addEventListener('click', () => {
      audio.playButtonClick();
      this.switchScreen('pve-menu');
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      audio.playButtonClick();
      this.resumeSavedGame();
    });

    document.getElementById('btn-settings-menu').addEventListener('click', () => {
      audio.playButtonClick();
      this.switchScreen('settings-menu');
    });

    document.getElementById('btn-back-pve').addEventListener('click', () => {
      audio.playButtonClick();
      this.switchScreen('main-menu');
    });

    document.getElementById('btn-back-settings').addEventListener('click', () => {
      audio.playButtonClick();
      this.saveSettingsForm();
      this.switchScreen('main-menu');
    });

    document.getElementById('btn-start-pve').addEventListener('click', () => {
      audio.playButtonClick();
      this.promptOrStartNewGame('pve');
    });

    // 2. Setup menu selections
    this.bindToggleButtonGroup('difficulty-toggle', (val) => {
      this.aiDifficulty = parseInt(val);
    });

    this.bindToggleButtonGroup('color-toggle', (val) => {
      this.playerColor = val;
    });

    // 3. Header gameplay actions
    document.getElementById('btn-pause').addEventListener('click', () => {
      audio.playButtonClick();
      document.getElementById('pause-modal').classList.add('active');
    });

    document.getElementById('btn-undo').addEventListener('click', () => {
      audio.playButtonClick();
      this.handleUndoAction();
    });

    document.getElementById('btn-redo').addEventListener('click', () => {
      audio.playButtonClick();
      this.handleRedoAction();
    });

    // 4. Modal actions
    document.getElementById('btn-resume-game').addEventListener('click', () => {
      audio.playButtonClick();
      document.getElementById('pause-modal').classList.remove('active');
    });

    document.getElementById('btn-restart-game').addEventListener('click', () => {
      audio.playButtonClick();
      document.getElementById('pause-modal').classList.remove('active');
      this.startFreshGame(this.gameMode);
    });

    document.getElementById('btn-exit-to-menu').addEventListener('click', () => {
      audio.playButtonClick();
      document.getElementById('pause-modal').classList.remove('active');
      this.switchScreen('main-menu');
    });

    document.getElementById('btn-restart-over').addEventListener('click', () => {
      audio.playButtonClick();
      document.getElementById('gameover-modal').classList.remove('active');
      this.startFreshGame(this.gameMode);
    });

    document.getElementById('btn-exit-over').addEventListener('click', () => {
      audio.playButtonClick();
      document.getElementById('gameover-modal').classList.remove('active');
      this.switchScreen('main-menu');
    });
  }

  switchScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
      activeScreen.classList.add('active');
    }

    // Lucide Icons Render trigger
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  bindToggleButtonGroup(groupId, callback) {
    const container = document.getElementById(groupId);
    if (!container) return;
    const buttons = container.querySelectorAll('.toggle-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playButtonClick();
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Find configuration val
        const val = btn.dataset.difficulty || btn.dataset.color;
        if (callback) callback(val);
      });
    });
  }

  saveSettingsForm() {
    const soundOn = document.getElementById('setting-sound').checked;
    const theme = document.getElementById('board-theme').value;

    audio.setEnabled(soundOn);

    const board = document.getElementById('chessboard');
    board.className = `chessboard ${theme}`;

    StorageManager.saveSettings({
      soundEnabled: soundOn,
      boardTheme: theme
    });
  }

  loadApplicationState() {
    // 1. Settings load
    const savedSettings = StorageManager.loadSettings();
    document.getElementById('setting-sound').checked = savedSettings.soundEnabled;
    document.getElementById('board-theme').value = savedSettings.boardTheme;
    audio.setEnabled(savedSettings.soundEnabled);

    const board = document.getElementById('chessboard');
    board.className = `chessboard ${savedSettings.boardTheme}`;

    // 2. Saved session check
    if (StorageManager.hasSavedGame()) {
      document.getElementById('btn-resume').classList.remove('hidden');
    } else {
      document.getElementById('btn-resume').classList.add('hidden');
    }

    // Start with Main Menu
    this.switchScreen('main-menu');
  }

  /**
   * Safe check to prevent accidental game overwrites.
   * If there's an active save, prompt for confirmation.
   */
  promptOrStartNewGame(mode) {
    if (StorageManager.hasSavedGame()) {
      const confirmModal = document.getElementById('confirm-modal');
      const yesBtn = document.getElementById('btn-confirm-yes');
      const noBtn = document.getElementById('btn-confirm-no');

      const handleYes = () => {
        audio.playButtonClick();
        confirmModal.classList.remove('active');
        yesBtn.removeEventListener('click', handleYes);
        noBtn.removeEventListener('click', handleNo);
        this.startFreshGame(mode);
      };

      const handleNo = () => {
        audio.playButtonClick();
        confirmModal.classList.remove('active');
        yesBtn.removeEventListener('click', handleYes);
        noBtn.removeEventListener('click', handleNo);
      };

      yesBtn.addEventListener('click', handleYes);
      noBtn.addEventListener('click', handleNo);
      confirmModal.classList.add('active');
    } else {
      this.startFreshGame(mode);
    }
  }

  /**
   * Initializes a brand-new pristine chess session
   */
  setAIThinking(thinking) {
    this.isAIThinking = thinking;
    const mascot = document.getElementById('astra-mascot');
    if (mascot) {
      if (thinking) {
        mascot.classList.add('thinking');
      } else {
        mascot.classList.remove('thinking');
      }
    }
  }

  /**
   * Initializes a brand-new pristine chess session
   */
  startFreshGame(mode) {
    this.game.reset();
    this.gameMode = mode;
    this.setAIThinking(false);

    if (mode === 'pve') {
      // Establish player color
      if (this.playerColor === 'random') {
        this.actualPlayerColor = Math.random() < 0.5 ? 'w' : 'b';
      } else {
        this.actualPlayerColor = this.playerColor === 'white' ? 'w' : 'b';
      }
    } else {
      this.actualPlayerColor = 'w'; // default orientation for PVP
    }

    // Set board visual flip orientation
    this.ui.setFlipped(this.actualPlayerColor === 'b');

    this.saveGameProgress();
    this.switchScreen('game-screen');

    this.ui.lastMoveHighlights = null;
    this.ui.clearHighlights();
    this.ui.drawBoard();

    // Trigger opening AI move if player selected Black color
    if (this.gameMode === 'pve' && this.actualPlayerColor === 'b') {
      this.triggerAIMove();
    }
  }

  /**
   * Resumes and deserializes previous ongoing session
   */
  resumeSavedGame() {
    const saved = StorageManager.loadGame();
    if (!saved) return;

    // Load state values
    this.game.board = saved.board;
    this.game.turn = saved.turn;
    this.game.castlingRights = saved.castlingRights;
    this.game.enPassantTarget = saved.enPassantTarget;
    this.game.halfmoveClock = saved.halfmoveClock;
    this.game.fullmoveNumber = saved.fullmoveNumber;
    this.game.positionHistory = saved.positionHistory;
    this.game.history = saved.history || [];
    this.game.redoStack = saved.redoStack || [];

    this.gameMode = saved.gameMode;
    this.aiDifficulty = saved.aiDifficulty;
    this.playerColor = saved.playerColor;

    if (this.gameMode === 'pve') {
      // Detect derived player color from save state or fallback
      this.actualPlayerColor = saved.playerColor === 'black' ? 'b' : 'w';
    } else {
      this.actualPlayerColor = 'w';
    }

    // Match board flip
    this.ui.setFlipped(this.actualPlayerColor === 'b');

    // Restore last move highlight from history difference if available
    if (this.game.history.length > 0) {
      const lastSnap = this.game.history[this.game.history.length - 1];
      const details = this.deriveMoveCoordsFromBoards(lastSnap.board, this.game.board);
      if (details) {
        this.ui.lastMoveHighlights = details;
      }
    } else {
      this.ui.lastMoveHighlights = null;
    }

    this.switchScreen('game-screen');
    this.ui.clearHighlights();
    this.ui.drawBoard();

    // If AI's turn immediately on reload:
    if (this.isAITurn()) {
      this.triggerAIMove();
    }
  }

  /**
   * Helper to derive coordinate indices that changed between turns
   */
  deriveMoveCoordsFromBoards(boardBefore, boardAfter) {
    let from = null;
    let to = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const b = boardBefore[r][c];
        const a = boardAfter[r][c];
        if (b && !a) {
          from = { r, c };
        } else if (!b && a) {
          to = { r, c };
        } else if (b && a && (b.type !== a.type || b.color !== a.color)) {
          // promotion or capture square is destination
          to = { r, c };
        }
      }
    }
    if (from && to) return { from, to };
    return null;
  }

  saveGameProgress() {
    StorageManager.saveGame(this.game, this.aiDifficulty, this.playerColor, this.gameMode);

    // Maintain Menu Resume Button availability status
    if (StorageManager.hasSavedGame()) {
      document.getElementById('btn-resume').classList.remove('hidden');
    } else {
      document.getElementById('btn-resume').classList.add('hidden');
    }
  }

  isAICurrentlyPlaying() {
    return this.isAIThinking || this.isAITurn();
  }

  isAITurn() {
    return this.gameMode === 'pve' && this.game.turn !== this.actualPlayerColor;
  }

  /**
   * Root core execution of gameplay moves (Both user triggers and AI prompts)
   */
  async handleMoveExecution(move, promotionChoice = 'q') {
    const from = move.from;
    const to = move.to;

    // 1. Perform visual smooth transitions
    await this.ui.animateMove(from, to);

    // 2. Perform absolute move within Chess Engine Logic
    const result = this.game.makeMove(move, promotionChoice);

    // 3. Audio effect triggers
    if (result.isCheck) {
      const gameOver = this.game.getGameOverState();
      if (gameOver.over && gameOver.reason === 'checkmate') {
        audio.playCheckmate();
      } else {
        audio.playCheck();
      }
    } else if (result.isCapture) {
      audio.playCapture();
    } else {
      audio.playMove();
    }

    // 4. Record last move highlighting coordinates
    this.ui.lastMoveHighlights = { from, to };

    // 5. Update UI, boards and check ending states
    this.ui.drawBoard();
    this.saveGameProgress();

    const gameOver = this.game.getGameOverState();
    if (gameOver.over) {
      this.handleGameOver(gameOver);
      return;
    }

    // 6. Next step scheduler (Trigger AI Opponent if matches setup)
    if (this.isAITurn()) {
      this.triggerAIMove();
    }
  }

  /**
   * Handle Moves made by user clicks or drops
   */
  onUserMoveMade(move, promotionChoice = 'q') {
    this.handleMoveExecution(move, promotionChoice);
  }

  /**
   * Invokes AI opponent searching modules
   */
  async triggerAIMove() {
    if (this.isAIThinking) return;
    this.setAIThinking(true);

    // Use depth map based on easy, medium, hard setup
    // Easy = Depth 1, Medium = Depth 2, Hard = Depth 3
    const bestMove = await ChessAI.getBestMove(this.game, this.aiDifficulty);
    this.setAIThinking(false);

    if (bestMove) {
      this.handleMoveExecution(bestMove, 'q'); // AI always promotes to Queen
    }
  }

  /**
   * Action trigger for Undo
   */
  handleUndoAction() {
    if (this.isAIThinking) return; // Prevent corrupt states

    if (this.gameMode === 'pve') {
      // In PVE mode, Undo reverts BOTH user and AI moves
      // This requires popping 2 snapshots off the stack
      if (this.game.history.length >= 2) {
        this.game.undo(); // undo AI move
        this.game.undo(); // undo player move
      } else {
        return; // Not enough moves to undo
      }
    } else {
      // PVP mode reverts a single turn
      this.game.undo();
    }

    // Update Highlights
    if (this.game.history.length > 0) {
      const lastSnap = this.game.history[this.game.history.length - 1];
      const details = this.deriveMoveCoordsFromBoards(lastSnap.board, this.game.board);
      if (details) {
        this.ui.lastMoveHighlights = details;
      }
    } else {
      this.ui.lastMoveHighlights = null;
    }

    this.ui.clearHighlights();
    this.ui.drawBoard();
    this.saveGameProgress();
  }

  /**
   * Action trigger for Redo
   */
  handleRedoAction() {
    if (this.isAIThinking) return;

    if (this.gameMode === 'pve') {
      // In PVE mode, Redo restores both moves together
      if (this.game.redoStack.length >= 2) {
        this.game.redo(); // redo player move
        this.game.redo(); // redo AI move
      } else {
        return;
      }
    } else {
      // PVP mode restores a single turn
      this.game.redo();
    }

    // Update Highlights
    if (this.game.history.length > 0) {
      const lastSnap = this.game.history[this.game.history.length - 1];
      const details = this.deriveMoveCoordsFromBoards(lastSnap.board, this.game.board);
      if (details) {
        this.ui.lastMoveHighlights = details;
      }
    } else {
      this.ui.lastMoveHighlights = null;
    }

    this.ui.clearHighlights();
    this.ui.drawBoard();
    this.saveGameProgress();
  }

  /**
   * Standard Game Over Modal triggers and content setups
   */
  handleGameOver(state) {
    StorageManager.clearSave(); // clear active session save upon standard game over completion

    const titleEl = document.getElementById('gameover-title');
    const reasonEl = document.getElementById('gameover-reason');

    if (state.reason === 'checkmate') {
      const winnerName = state.winner === 'w' ? 'White' : 'Black';
      titleEl.textContent = `${winnerName} Wins!`;
      reasonEl.textContent = 'By Checkmate.';
    } else {
      titleEl.textContent = 'Draw Game';
      if (state.reason === 'stalemate') {
        reasonEl.textContent = 'Stalemate reached.';
      } else if (state.reason === 'fifty-move') {
        reasonEl.textContent = '50-Move Rule draw.';
      } else if (state.reason === 'repetition') {
        reasonEl.textContent = 'Threefold Repetition draw.';
      } else if (state.reason === 'insufficient') {
        reasonEl.textContent = 'Draw by Insufficient Material.';
      }
    }

    document.getElementById('gameover-modal').classList.add('active');
  }
}

// Instantiate App
window.addEventListener('DOMContentLoaded', () => {
  window.app = new ChessAppController();
});
