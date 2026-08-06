/**
 * js/game.js
 * Comprehensive standard chess rule engine with board state management, move validation,
 * special rules (castling, en passant, promotion), undo/redo stacks, and draws (stalemate,
 * threefold repetition, fifty-move rule, insufficient material).
 */

import { INITIAL_BOARD } from './constants.js';

export class ChessGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
    this.turn = 'w'; // 'w' or 'b'

    // Castling Rights
    this.castlingRights = {
      w: { kingSide: true, queenSide: true },
      b: { kingSide: true, queenSide: true }
    };

    // En Passant target square: { r, c } or null
    this.enPassantTarget = null;

    // Half-move clock for 50-move rule
    this.halfmoveClock = 0;

    // Full-move counter starts at 1
    this.fullmoveNumber = 1;

    // History and Redo stacks
    this.history = []; // stack of completed game states
    this.redoStack = []; // stack for redo operations

    // Keep track of positions to detect Threefold Repetition
    this.positionHistory = [];
    this.recordPosition();
  }

  /**
   * Shallow copy of game state variables for undo/redo snapshots
   */
  getSnapshot() {
    return {
      board: JSON.parse(JSON.stringify(this.board)),
      turn: this.turn,
      castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
      enPassantTarget: this.enPassantTarget ? { ...this.enPassantTarget } : null,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber,
      positionHistory: [...this.positionHistory]
    };
  }

  loadSnapshot(snap) {
    this.board = JSON.parse(JSON.stringify(snap.board));
    this.turn = snap.turn;
    this.castlingRights = JSON.parse(JSON.stringify(snap.castlingRights));
    this.enPassantTarget = snap.enPassantTarget ? { ...snap.enPassantTarget } : null;
    this.halfmoveClock = snap.halfmoveClock;
    this.fullmoveNumber = snap.fullmoveNumber;
    this.positionHistory = [...snap.positionHistory];
  }

  /**
   * Translates the board state into an FEN-like or canonical key to track repetitions.
   * Since FEN is simple, we generate a custom standardized string representing:
   * Board + Turn + Castling + EP Target
   */
  generatePositionKey() {
    let boardStr = '';
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (!piece) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            boardStr += emptyCount;
            emptyCount = 0;
          }
          const symbol = piece.type;
          boardStr += piece.color === 'w' ? symbol.toUpperCase() : symbol.toLowerCase();
        }
      }
      if (emptyCount > 0) {
        boardStr += emptyCount;
      }
      if (r < 7) boardStr += '/';
    }

    let castleStr = '';
    if (this.castlingRights.w.kingSide) castleStr += 'K';
    if (this.castlingRights.w.queenSide) castleStr += 'Q';
    if (this.castlingRights.b.kingSide) castleStr += 'k';
    if (this.castlingRights.b.queenSide) castleStr += 'q';
    if (!castleStr) castleStr = '-';

    let epStr = '-';
    if (this.enPassantTarget) {
      const files = ['a','b','c','d','e','f','g','h'];
      epStr = files[this.enPassantTarget.c] + (8 - this.enPassantTarget.r);
    }

    return `${boardStr} ${this.turn} ${castleStr} ${epStr}`;
  }

  recordPosition() {
    const key = this.generatePositionKey();
    this.positionHistory.push(key);
  }

  /**
   * Basic bounds check
   */
  inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  /**
   * Gets all pseudo-legal moves for a specific square (excluding king safety check)
   */
  getPseudoMoves(r, c) {
    const piece = this.board[r][c];
    if (!piece) return [];

    const color = piece.color;
    const enemyColor = color === 'w' ? 'b' : 'w';
    const moves = [];

    switch (piece.type) {
      case 'p': {
        const dir = color === 'w' ? -1 : 1;
        const startRank = color === 'w' ? 6 : 1;

        // Single step forward
        if (this.inBounds(r + dir, c) && !this.board[r + dir][c]) {
          moves.push({ from: { r, c }, to: { r: r + dir, c } });

          // Double step forward from starting rank
          if (r === startRank && !this.board[r + 2 * dir][c]) {
            moves.push({ from: { r, c }, to: { r: r + 2 * dir, c } });
          }
        }

        // Standard captures
        const captureOffsets = [-1, 1];
        for (const dc of captureOffsets) {
          const nr = r + dir;
          const nc = c + dc;
          if (this.inBounds(nr, nc)) {
            const destPiece = this.board[nr][nc];
            if (destPiece && destPiece.color === enemyColor) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            }
            // En Passant capture
            if (this.enPassantTarget && this.enPassantTarget.r === nr && this.enPassantTarget.c === nc) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, isEnPassant: true });
            }
          }
        }
        break;
      }

      case 'n': {
        const offsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of offsets) {
          const nr = r + dr;
          const nc = c + dc;
          if (this.inBounds(nr, nc)) {
            const destPiece = this.board[nr][nc];
            if (!destPiece || destPiece.color === enemyColor) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            }
          }
        }
        break;
      }

      case 'b':
      case 'r':
      case 'q': {
        const dirs = [];
        if (piece.type === 'r' || piece.type === 'q') {
          dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
        }
        if (piece.type === 'b' || piece.type === 'q') {
          dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        }

        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (this.inBounds(nr, nc)) {
            const destPiece = this.board[nr][nc];
            if (!destPiece) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            } else {
              if (destPiece.color === enemyColor) {
                moves.push({ from: { r, c }, to: { r: nr, c: nc } });
              }
              break; // Blocked by piece
            }
            nr += dr;
            nc += dc;
          }
        }
        break;
      }

      case 'k': {
        const dirs = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1]
        ];
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (this.inBounds(nr, nc)) {
            const destPiece = this.board[nr][nc];
            if (!destPiece || destPiece.color === enemyColor) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc } });
            }
          }
        }

        // Castling moves (strictly checked later if the king is not in check, hasn't moved, target squares aren't under attack)
        const rank = color === 'w' ? 7 : 0;
        if (r === rank && c === 4) {
          // King-side Castling
          if (this.castlingRights[color].kingSide) {
            if (!this.board[rank][5] && !this.board[rank][6]) {
              moves.push({ from: { r, c }, to: { r: rank, c: 6 }, isCastle: 'king' });
            }
          }
          // Queen-side Castling
          if (this.castlingRights[color].queenSide) {
            if (!this.board[rank][3] && !this.board[rank][2] && !this.board[rank][1]) {
              moves.push({ from: { r, c }, to: { r: rank, c: 2 }, isCastle: 'queen' });
            }
          }
        }
        break;
      }
    }

    return moves;
  }

  /**
   * Checks if a square is attacked by any opposing piece
   */
  isSquareAttacked(r, c, attackerColor) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === attackerColor) {
          // Handle pawn attacks differently since pawns attack diagonally
          if (piece.type === 'p') {
            const dir = attackerColor === 'w' ? -1 : 1;
            if (row + dir === r && (col - 1 === c || col + 1 === c)) {
              return true;
            }
          } else {
            const pseudoMoves = this.getPseudoMoves(row, col);
            for (const move of pseudoMoves) {
              if (move.to.r === r && move.to.c === c) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  findKing(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return { r, c };
        }
      }
    }
    return null;
  }

  isInCheck(color) {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;
    const enemyColor = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(kingPos.r, kingPos.c, enemyColor);
  }

  /**
   * Simulates a move to check if it keeps or puts the King in check
   */
  leavesKingInCheck(move, color) {
    const { from, to, isEnPassant, isCastle } = move;
    const backupFromPiece = this.board[from.r][from.c];
    const backupToPiece = this.board[to.r][to.c];
    let backupEPPiece = null;
    let epPieceRow = null;
    let epPieceCol = null;

    // Simulate EP
    if (isEnPassant) {
      epPieceRow = from.r;
      epPieceCol = to.c;
      backupEPPiece = this.board[epPieceRow][epPieceCol];
      this.board[epPieceRow][epPieceCol] = null;
    }

    // Simulate move
    this.board[to.r][to.c] = backupFromPiece;
    this.board[from.r][from.c] = null;

    let inCheck = this.isInCheck(color);

    // Rollback EP
    if (isEnPassant) {
      this.board[epPieceRow][epPieceCol] = backupEPPiece;
    }

    // Rollback move
    this.board[from.r][from.c] = backupFromPiece;
    this.board[to.r][to.c] = backupToPiece;

    return inCheck;
  }

  /**
   * Refined and absolute legal moves for a given piece on a square
   */
  getLegalMoves(r, c) {
    const piece = this.board[r][c];
    if (!piece || piece.color !== this.turn) return [];

    const pseudoMoves = this.getPseudoMoves(r, c);
    const legalMoves = [];

    for (const move of pseudoMoves) {
      // 1. Ensure King is not in check after the move
      if (this.leavesKingInCheck(move, piece.color)) {
        continue;
      }

      // 2. Castling logic refinement (cannot castle out of, through, or into check)
      if (move.isCastle) {
        const enemyColor = piece.color === 'w' ? 'b' : 'w';
        if (this.isInCheck(piece.color)) {
          continue; // Cannot castle out of check
        }

        const intermediateCol = move.isCastle === 'king' ? 5 : 3;
        if (this.isSquareAttacked(r, intermediateCol, enemyColor)) {
          continue; // Cannot castle through check
        }
      }

      legalMoves.push(move);
    }

    return legalMoves;
  }

  /**
   * Gathers all legal moves for the player whose turn it currently is
   */
  getAllLegalMoves(color = this.turn) {
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.color === color) {
          all.push(...this.getLegalMoves(r, c));
        }
      }
    }
    return all;
  }

  /**
   * Performs the move on the active board, updates turn, clocks, and returns meta info
   * (isCapture, isPromotion, etc)
   */
  makeMove(move, promotionChoice = 'q') {
    const snapshot = this.getSnapshot();
    this.history.push(snapshot);
    this.redoStack = []; // Clear redo stack on manual move

    const { from, to, isCastle, isEnPassant } = move;
    const piece = this.board[from.r][from.c];
    const targetPiece = this.board[to.r][to.c];

    let isCapture = !!targetPiece;
    let isPromotion = false;

    // Reset EP target unless pawn moves double forward below
    const oldEnPassantTarget = this.enPassantTarget;
    this.enPassantTarget = null;

    // Standard piece move
    this.board[to.r][to.c] = piece;
    this.board[from.r][from.c] = null;

    // Reset/Increment half-move clock (pawn move or capture resets it to 0)
    if (piece.type === 'p' || isCapture) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }

    // Pawn specific rules
    if (piece.type === 'p') {
      // Double step pawn target for EP
      const dir = piece.color === 'w' ? -1 : 1;
      if (Math.abs(to.r - from.r) === 2) {
        this.enPassantTarget = { r: from.r + dir, c: from.c };
      }

      // En Passant capture execution
      if (isEnPassant) {
        this.board[from.r][to.c] = null;
        isCapture = true;
      }

      // Promotion
      const promotionRank = piece.color === 'w' ? 0 : 7;
      if (to.r === promotionRank) {
        isPromotion = true;
        this.board[to.r][to.c] = { type: promotionChoice.toLowerCase(), color: piece.color };
      }
    }

    // Castling execution
    if (isCastle) {
      const rank = piece.color === 'w' ? 7 : 0;
      if (move.isCastle === 'king') {
        // Move Rook from c=7 to c=5
        this.board[rank][5] = this.board[rank][7];
        this.board[rank][7] = null;
      } else if (move.isCastle === 'queen') {
        // Move Rook from c=0 to c=3
        this.board[rank][3] = this.board[rank][0];
        this.board[rank][0] = null;
      }
    }

    // Update Castling Rights (if King or Rook move)
    if (piece.type === 'k') {
      this.castlingRights[piece.color].kingSide = false;
      this.castlingRights[piece.color].queenSide = false;
    } else if (piece.type === 'r') {
      const homeRank = piece.color === 'w' ? 7 : 0;
      if (from.r === homeRank) {
        if (from.c === 0) this.castlingRights[piece.color].queenSide = false;
        if (from.c === 7) this.castlingRights[piece.color].kingSide = false;
      }
    }

    // If an enemy Rook is captured on its original square, update castling rights
    if (isCapture && targetPiece.type === 'r') {
      const enemyColor = piece.color === 'w' ? 'b' : 'w';
      const homeRank = enemyColor === 'w' ? 7 : 0;
      if (to.r === homeRank) {
        if (to.c === 0) this.castlingRights[enemyColor].queenSide = false;
        if (to.c === 7) this.castlingRights[enemyColor].kingSide = false;
      }
    }

    // Advance full-move number if black just played
    if (this.turn === 'b') {
      this.fullmoveNumber++;
    }

    // Toggle turn
    this.turn = this.turn === 'w' ? 'b' : 'w';

    // Record position key for repetition checks
    this.recordPosition();

    return {
      isCapture,
      isPromotion,
      isCastle,
      isCheck: this.isInCheck(this.turn)
    };
  }

  /**
   * Restores previous turn and pops from history stack
   */
  undo() {
    if (this.history.length === 0) return false;
    const currentSnap = this.getSnapshot();
    this.redoStack.push(currentSnap);

    const prevSnap = this.history.pop();
    this.loadSnapshot(prevSnap);
    return true;
  }

  /**
   * Re-applies the last undone turn
   */
  redo() {
    if (this.redoStack.length === 0) return false;
    const currentSnap = this.getSnapshot();
    this.history.push(currentSnap);

    const nextSnap = this.redoStack.pop();
    this.loadSnapshot(nextSnap);
    return true;
  }

  /**
   * Evaluation checks for Game End conditions
   */
  isCheckmate() {
    return this.isInCheck(this.turn) && this.getAllLegalMoves().length === 0;
  }

  isStalemate() {
    return !this.isInCheck(this.turn) && this.getAllLegalMoves().length === 0;
  }

  isFiftyMoveDraw() {
    // 50 full moves (which is 100 half-moves) without a pawn move or capture
    return this.halfmoveClock >= 100;
  }

  isThreefoldRepetition() {
    if (this.positionHistory.length < 3) return false;
    const counts = {};
    for (const key of this.positionHistory) {
      // Truncate the keys to ignore halfmove clock and fullmove numbers for repetition standard.
      // Canonical key contains: Board + Turn + Castling Rights + EP square. This is exactly what standard repetition rules require.
      counts[key] = (counts[key] || 0) + 1;
      if (counts[key] >= 3) {
        return true;
      }
    }
    return false;
  }

  isInsufficientMaterial() {
    // Collect active pieces
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece) {
          pieces.push({ ...piece, r, c });
        }
      }
    }

    // King vs King
    if (pieces.length === 2) {
      return true;
    }

    // King + Bishop vs King OR King + Knight vs King
    if (pieces.length === 3) {
      const activePiece = pieces.find(p => p.type !== 'k');
      if (activePiece && (activePiece.type === 'b' || activePiece.type === 'n')) {
        return true;
      }
    }

    // King + Bishop vs King + Bishop (on same colored squares)
    if (pieces.length === 4) {
      const b1 = pieces.filter(p => p.type === 'b');
      if (b1.length === 2 && b1[0].color !== b1[1].color) {
        // Both sides have a bishop. Check if they are on same color squares.
        const isLightSquare = (r, c) => (r + c) % 2 === 0;
        if (isLightSquare(b1[0].r, b1[0].c) === isLightSquare(b1[1].r, b1[1].c)) {
          return true;
        }
      }
    }

    return false;
  }

  getGameOverState() {
    if (this.isCheckmate()) {
      const winner = this.turn === 'w' ? 'b' : 'w';
      return { over: true, reason: 'checkmate', winner };
    }
    if (this.isStalemate()) {
      return { over: true, reason: 'stalemate', winner: null };
    }
    if (this.isFiftyMoveDraw()) {
      return { over: true, reason: 'fifty-move', winner: null };
    }
    if (this.isThreefoldRepetition()) {
      return { over: true, reason: 'repetition', winner: null };
    }
    if (this.isInsufficientMaterial()) {
      return { over: true, reason: 'insufficient', winner: null };
    }
    return { over: false, reason: null, winner: null };
  }
}
export default ChessGame;
