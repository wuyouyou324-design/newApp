/**
 * js/ui.js
 * Visual controller that connects DOM actions, user input (clicks/drag-and-drops),
 * and CSS smooth piece transition animations with the standard game state model.
 */

import { PIECE_SVGS } from './constants.js';
import { audio } from './audio.js';

export class ChessUI {
  constructor(game, mainController) {
    this.game = game;
    this.controller = mainController;

    // DOM Elements
    this.boardEl = document.getElementById('chessboard');
    this.turnDotEl = document.getElementById('turn-dot');
    this.turnTextEl = document.getElementById('turn-text');
    this.capturedTopIconsEl = document.getElementById('captured-top-icons');
    this.capturedBottomIconsEl = document.getElementById('captured-bottom-icons');
    this.scoreTopDiffEl = document.getElementById('score-top-diff');
    this.scoreBottomDiffEl = document.getElementById('score-bottom-diff');
    this.moveHistoryListEl = document.getElementById('move-history-list');

    this.promotionModal = document.getElementById('promotion-modal');
    this.promotionChoicesContainer = document.getElementById('promotion-choices-container');

    // UI state tracking
    this.selectedSquare = null; // { r, c }
    this.highlightedDestinations = []; // list of { r, c, isCapture }
    this.lastMoveHighlights = null; // { from: {r,c}, to: {r,c} }
    this.activeDragPiece = null; // DOM Element currently dragged
    this.dragStartCoords = null; // { r, c }

    // Flip board configuration: true if black pieces should be rendered at the bottom
    this.flipped = false;

    this.initEventListeners();
  }

  setFlipped(flipped) {
    this.flipped = !!flipped;
  }

  initEventListeners() {
    // Touch/Mouse events for clicks & drag-and-drop
    this.boardEl.addEventListener('mousedown', (e) => this.handlePointerDown(e));
    this.boardEl.addEventListener('touchstart', (e) => this.handlePointerDown(e), { passive: false });

    window.addEventListener('mousemove', (e) => this.handlePointerMove(e));
    window.addEventListener('touchmove', (e) => this.handlePointerMove(e), { passive: false });

    window.addEventListener('mouseup', (e) => this.handlePointerUp(e));
    window.addEventListener('touchend', (e) => this.handlePointerUp(e));
  }

  /**
   * Translates 0-7 indices to grid positions, considering board flipping
   */
  getRenderCoords(r, c) {
    if (this.flipped) {
      return { r: 7 - r, c: 7 - c };
    }
    return { r, c };
  }

  getLogicalCoords(renderedRow, renderedCol) {
    if (this.flipped) {
      return { r: 7 - renderedRow, c: 7 - renderedCol };
    }
    return { r: renderedRow, c: renderedCol };
  }

  /**
   * Helper to identify square from DOM element or its target parents
   */
  getSquareCoordsFromElement(el) {
    const square = el.closest('.square');
    if (!square) return null;
    const r = parseInt(square.dataset.row);
    const c = parseInt(square.dataset.col);
    return this.getLogicalCoords(r, c);
  }

  /**
   * Renders the coordinate rows & cols dynamically
   */
  renderCoordinates() {
    const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const renderFiles = this.flipped ? [...files].reverse() : files;
    const renderRanks = this.flipped ? [...ranks].reverse() : ranks;

    const topFilesEl = document.querySelector('.top-files');
    const bottomFilesEl = document.querySelector('.bottom-files');
    const leftRanksEl = document.querySelector('.left-ranks');
    const rightRanksEl = document.querySelector('.right-ranks');

    if (topFilesEl) topFilesEl.innerHTML = renderFiles.map(f => `<span>${f}</span>`).join('');
    if (bottomFilesEl) bottomFilesEl.innerHTML = renderFiles.map(f => `<span>${f}</span>`).join('');
    if (leftRanksEl) leftRanksEl.innerHTML = renderRanks.map(r => `<span>${r}</span>`).join('');
    if (rightRanksEl) rightRanksEl.innerHTML = renderRanks.map(r => `<span>${r}</span>`).join('');
  }

  /**
   * Fully redraws/renders the chessboard
   */
  drawBoard() {
    this.boardEl.innerHTML = '';

    // Generate Squares
    for (let renderR = 0; renderR < 8; renderR++) {
      for (let renderC = 0; renderC < 8; renderC++) {
        const { r, c } = this.getLogicalCoords(renderR, renderC);
        const piece = this.game.board[r][c];
        const isDark = (renderR + renderC) % 2 === 1;

        const square = document.createElement('div');
        square.className = `square ${isDark ? 'dark' : 'light'}`;
        square.dataset.row = renderR;
        square.dataset.col = renderC;

        // Apply Highlights
        if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
          square.classList.add('selected');
        }

        const destHL = this.highlightedDestinations.find(d => d.r === r && d.c === c);
        if (destHL) {
          square.classList.add(destHL.isCapture ? 'dest-capture' : 'dest-empty');
        }

        if (this.lastMoveHighlights) {
          const from = this.lastMoveHighlights.from;
          const to = this.lastMoveHighlights.to;
          if ((from.r === r && from.c === c) || (to.r === r && to.c === c)) {
            square.classList.add('last-move');
          }
        }

        // Check Highlight
        if (piece && piece.type === 'k' && this.game.isInCheck(piece.color)) {
          square.classList.add('in-check');
        }

        // Add Piece Element if exists
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          pieceEl.innerHTML = PIECE_SVGS[piece.color][piece.type];
          pieceEl.dataset.type = piece.type;
          pieceEl.dataset.color = piece.color;
          // Ensure piece is grabable if it is current player's turn and not AI controlled
          if (piece.color === this.game.turn && !this.controller.isAICurrentlyPlaying()) {
            pieceEl.style.cursor = 'grab';
          } else {
            pieceEl.style.cursor = 'default';
          }
          square.appendChild(pieceEl);
        }

        this.boardEl.appendChild(square);
      }
    }

    this.renderCoordinates();
    this.updateStatusPanels();
  }

  /**
   * CSS Transition Move Animation:
   * Moves a piece smoothly from old to new grid coords, and resolves.
   */
  animateMove(from, to) {
    return new Promise((resolve) => {
      const fromRender = this.getRenderCoords(from.r, from.c);
      const toRender = this.getRenderCoords(to.r, to.c);

      const fromSquare = this.boardEl.querySelector(`[data-row="${fromRender.r}"][data-col="${fromRender.c}"]`);
      if (!fromSquare) return resolve();

      const pieceEl = fromSquare.querySelector('.piece');
      if (!pieceEl) return resolve();

      // Calculate translation offsets
      const squareSize = fromSquare.getBoundingClientRect().width;
      const dx = (toRender.c - fromRender.c) * squareSize;
      const dy = (toRender.r - fromRender.r) * squareSize;

      // Ensure piece sits above other squares
      pieceEl.style.zIndex = '50';

      // Perform transition
      pieceEl.style.transform = `translate(${dx}px, ${dy}px)`;

      // Resolve once CSS animation finishes (approx 180ms)
      const handleTransitionEnd = () => {
        pieceEl.removeEventListener('transitionend', handleTransitionEnd);
        pieceEl.style.transform = '';
        pieceEl.style.zIndex = '';
        resolve();
      };
      pieceEl.addEventListener('transitionend', handleTransitionEnd);

      // Fallback timer if browser skips transitionend
      setTimeout(() => {
        pieceEl.style.transform = '';
        pieceEl.style.zIndex = '';
        resolve();
      }, 220);
    });
  }

  /**
   * Event triggers for clicks or tap-holds on board squares
   */
  handlePointerDown(e) {
    if (this.controller.isAICurrentlyPlaying()) return;

    const targetPiece = e.target.closest('.piece');
    const coords = this.getSquareCoordsFromElement(e.target);
    if (!coords) return;

    // Check if clicked an existing highlight destination square
    const destHL = this.highlightedDestinations.find(d => d.r === coords.r && d.c === coords.c);
    if (destHL) {
      e.preventDefault();
      this.executeUserMove(this.selectedSquare, coords);
      return;
    }

    // Select piece
    const piece = this.game.board[coords.r][coords.c];
    if (piece && piece.color === this.game.turn) {
      e.preventDefault();
      this.selectedSquare = coords;

      // Fetch all legal destinations for highlighted markers
      const legalMoves = this.game.getLegalMoves(coords.r, coords.c);
      this.highlightedDestinations = legalMoves.map(m => {
        const destPiece = this.game.board[m.to.r][m.to.c];
        const isCapture = !!destPiece || m.isEnPassant;
        return { r: m.to.r, c: m.to.c, isCapture };
      });

      // Drag init
      if (targetPiece) {
        this.activeDragPiece = targetPiece;
        this.dragStartCoords = coords;
        targetPiece.classList.add('dragging');
        this.positionDragPiece(e);
      }

      this.drawBoard();
    } else {
      // Clicked on empty space or enemy piece without active selection: cancel selection
      this.clearHighlights();
      this.drawBoard();
    }
  }

  handlePointerMove(e) {
    if (!this.activeDragPiece) return;
    e.preventDefault();
    this.positionDragPiece(e);
  }

  handlePointerUp(e) {
    if (!this.activeDragPiece) return;

    this.activeDragPiece.classList.remove('dragging');
    this.activeDragPiece.style.transform = '';
    this.activeDragPiece.style.left = '';
    this.activeDragPiece.style.top = '';
    this.activeDragPiece.style.position = '';

    // Determine drop target coordinates
    // For touch devices, find element from changedTouches coordinates
    let clientX, clientY;
    if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dropTarget = document.elementFromPoint(clientX, clientY);
    const dropCoords = dropTarget ? this.getSquareCoordsFromElement(dropTarget) : null;

    const from = this.dragStartCoords;
    const to = dropCoords;

    this.activeDragPiece = null;
    this.dragStartCoords = null;

    if (to && (from.r !== to.r || from.c !== to.c)) {
      const isLegal = this.highlightedDestinations.some(d => d.r === to.r && d.c === to.c);
      if (isLegal) {
        this.executeUserMove(from, to);
        return;
      }
    }

    // Redraw board standardly to reset dragging artifacts
    this.drawBoard();
  }

  positionDragPiece(e) {
    if (!this.activeDragPiece) return;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const pieceRect = this.activeDragPiece.getBoundingClientRect();
    const boardRect = this.boardEl.getBoundingClientRect();

    // Position element centered to cursor relative to viewport
    this.activeDragPiece.style.position = 'fixed';
    this.activeDragPiece.style.left = `${clientX - pieceRect.width / 2}px`;
    this.activeDragPiece.style.top = `${clientY - pieceRect.height / 2}px`;
  }

  clearHighlights() {
    this.selectedSquare = null;
    this.highlightedDestinations = [];
  }

  /**
   * Relays validated user input moves to the main controller game engine loop
   */
  async executeUserMove(from, to) {
    const legalMoves = this.game.getLegalMoves(from.r, from.c);
    const move = legalMoves.find(m => m.to.r === to.r && m.to.c === to.c);
    if (!move) return;

    this.clearHighlights();

    // Trigger visual pawn promotion UI if needed
    if (move.from && this.game.board[move.from.r][move.from.c]?.type === 'p' && (move.to.r === 0 || move.to.r === 7)) {
      const promotionChoice = await this.promptPawnPromotion(this.game.turn);
      this.controller.onUserMoveMade(move, promotionChoice);
    } else {
      this.controller.onUserMoveMade(move);
    }
  }

  /**
   * Promotion selection overlay choices Modal
   */
  promptPawnPromotion(color) {
    return new Promise((resolve) => {
      this.promotionChoicesContainer.innerHTML = '';
      const choices = [
        { type: 'q', label: 'Queen' },
        { type: 'r', label: 'Rook' },
        { type: 'b', label: 'Bishop' },
        { type: 'n', label: 'Knight' }
      ];

      choices.forEach(choice => {
        const div = document.createElement('div');
        div.className = 'promotion-choice';
        div.innerHTML = PIECE_SVGS[color][choice.type];
        div.title = choice.label;
        div.addEventListener('click', () => {
          this.promotionModal.classList.remove('active');
          audio.playButtonClick();
          resolve(choice.type);
        });
        this.promotionChoicesContainer.appendChild(div);
      });

      this.promotionModal.classList.add('active');
    });
  }

  /**
   * Refreshes status displays like move log list, score difference and captures
   */
  updateStatusPanels() {
    // Current turn dot indicator update
    if (this.game.turn === 'w') {
      this.turnDotEl.className = 'dot white-dot';
      this.turnTextEl.textContent = "White's Turn";
    } else {
      this.turnDotEl.className = 'dot black-dot';
      this.turnTextEl.textContent = "Black's Turn";
    }

    this.drawCapturedPiecesAndScore();
    this.drawMoveHistoryTable();
  }

  /**
   * Aggregates and displays captured assets & relative strength values
   */
  drawCapturedPiecesAndScore() {
    // Standard starting set of pieces (excluding kings)
    const initialCounts = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
    };

    // Count currently alive pieces
    const currentCounts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    };

    let whiteMaterialValue = 0;
    let blackMaterialValue = 0;

    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.game.board[r][c];
        if (piece && piece.type !== 'k') {
          currentCounts[piece.color][piece.type]++;
          const val = pieceValues[piece.type] || 0;
          if (piece.color === 'w') whiteMaterialValue += val;
          else blackMaterialValue += val;
        }
      }
    }

    // Determine Captured Pieces lists
    const captured = { w: [], b: [] }; // w = captured white pieces, b = captured black pieces
    const typesOrder = ['q', 'r', 'b', 'n', 'p'];

    for (const color of ['w', 'b']) {
      for (const type of typesOrder) {
        const numCaptured = initialCounts[color][type] - currentCounts[color][type];
        for (let i = 0; i < numCaptured; i++) {
          captured[color].push(type);
        }
      }
    }

    // Sort captures by point value descending (Queen, Rook, etc)
    const renderCaptured = (container, scoreEl, piecesList, color, sideLabel) => {
      container.innerHTML = '';
      piecesList.forEach(type => {
        const svgWrapper = document.createElement('div');
        svgWrapper.style.width = '20px';
        svgWrapper.style.height = '20px';
        svgWrapper.style.opacity = '0.7';
        svgWrapper.innerHTML = PIECE_SVGS[color][type];
        container.appendChild(svgWrapper);
      });
    };

    // Calculate score differences
    let topScoreDiffStr = '';
    let bottomScoreDiffStr = '';

    // Relative to Player's Perspective:
    // If player color is White, Top is Black captured list, Bottom is White captured list.
    // If player color is Black, Top is White captured list, Bottom is Black captured list.
    const isPlayerWhite = this.flipped === false;

    if (isPlayerWhite) {
      // Top shows captured Black pieces (score relative to White)
      const diff = whiteMaterialValue - blackMaterialValue;
      if (diff > 0) topScoreDiffStr = `+${diff}`;
      else if (diff < 0) bottomScoreDiffStr = `+${Math.abs(diff)}`;

      renderCaptured(this.capturedTopIconsEl, this.scoreTopDiffEl, captured.b, 'b', 'b');
      renderCaptured(this.capturedBottomIconsEl, this.scoreBottomDiffEl, captured.w, 'w', 'w');
    } else {
      // Top shows captured White pieces (score relative to Black)
      const diff = blackMaterialValue - whiteMaterialValue;
      if (diff > 0) topScoreDiffStr = `+${diff}`;
      else if (diff < 0) bottomScoreDiffStr = `+${Math.abs(diff)}`;

      renderCaptured(this.capturedTopIconsEl, this.scoreTopDiffEl, captured.w, 'w', 'w');
      renderCaptured(this.capturedBottomIconsEl, this.scoreBottomDiffEl, captured.b, 'b', 'b');
    }

    this.scoreTopDiffEl.textContent = topScoreDiffStr;
    this.scoreBottomDiffEl.textContent = bottomScoreDiffStr;
  }

  /**
   * Generates standard SAN (Standard Algebraic Notation) strings and updates side panel list
   */
  drawMoveHistoryTable() {
    this.moveHistoryListEl.innerHTML = '';

    const snapHistory = this.game.history;
    const moves = [];

    // Derive SAN moves by analyzing history logs step-by-step
    for (let i = 0; i < snapHistory.length; i++) {
      const snapCurrent = snapHistory[i];
      const snapNext = (i + 1 < snapHistory.length) ? snapHistory[i + 1] : this.game.getSnapshot();

      // Find the difference between snapCurrent and snapNext to determine SAN move details
      const moveDetails = this.deriveMoveDetails(snapCurrent.board, snapNext.board, snapCurrent.turn);
      if (moveDetails) {
        moves.push(moveDetails);
      }
    }

    // Render pairs
    let rowNum = 1;
    for (let i = 0; i < moves.length; i += 2) {
      const tr = document.createElement('tr');
      const whiteMove = moves[i] || '';
      const blackMove = moves[i + 1] || '';

      tr.innerHTML = `
        <td style="color: var(--text-muted); width: 40px;">${rowNum}.</td>
        <td>${whiteMove}</td>
        <td>${blackMove}</td>
      `;
      this.moveHistoryListEl.appendChild(tr);
      rowNum++;
    }

    // Auto Scroll bottom
    const container = this.moveHistoryListEl.parentElement.parentElement;
    container.scrollTop = container.scrollHeight;
  }

  deriveMoveDetails(boardBefore, boardAfter, moveColor) {
    // 1. Identify which coordinates changed
    let from = null;
    let to = null;
    let pieceType = '';
    let isCapture = false;
    let isCastle = null;

    // Compare boards
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const b = boardBefore[r][c];
        const a = boardAfter[r][c];

        if (b && !a) {
          // Piece left this square
          if (b.color === moveColor) {
            from = { r, c };
            pieceType = b.type;
          }
        } else if (!b && a) {
          // Piece landed on this square
          if (a.color === moveColor) {
            to = { r, c };
          }
        } else if (b && a && (b.type !== a.type || b.color !== a.color)) {
          // Capture or promotion occurred
          if (a.color === moveColor) {
            to = { r, c };
            pieceType = a.type; // holds promoting type
            if (b.color !== moveColor) {
              isCapture = true;
            }
          }
        }
      }
    }

    if (!from || !to) return null;

    // Detect Castling Special
    if (pieceType === 'k' && Math.abs(to.c - from.c) === 2) {
      if (to.c === 6) return 'O-O';
      if (to.c === 2) return 'O-O-O';
    }

    // SAN formatting
    const files = ['a','b','c','d','e','f','g','h'];
    const ranks = ['8','7','6','5','4','3','2','1'];

    let notation = '';
    if (pieceType !== 'p') {
      notation += pieceType.toUpperCase();
    } else {
      if (isCapture || (from.c !== to.c)) {
        notation += files[from.c];
      }
    }

    if (isCapture || (boardBefore[to.r][to.c] && boardBefore[to.r][to.c].color !== moveColor)) {
      notation += 'x';
    }

    notation += files[to.c] + ranks[to.r];

    // Detect Promotion suffix
    if (pieceType === 'p' && (to.r === 0 || to.r === 7)) {
      // Find promoted piece in boardAfter
      const promotedPiece = boardAfter[to.r][to.c];
      if (promotedPiece) {
        notation += '=' + promotedPiece.type.toUpperCase();
      }
    }

    return notation;
  }
}

export default ChessUI;
