/**
 * js/ai.js
 * Optimized chess AI opponent utilizing minimax searching with alpha-beta pruning.
 * Integrates material evaluation and position-based Piece-Square Tables (PST).
 */

import { PIECE_VALUES, PST } from './constants.js';

export class ChessAI {
  /**
   * Static evaluation of the board representation
   * White's value is positive, Black's is negative
   */
  static evaluate(board) {
    let evaluation = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const type = piece.type;
        const color = piece.color;

        // Base material weight
        let value = PIECE_VALUES[type] || 0;

        // Position weight based on PST
        let pstTable = PST[type];
        if (pstTable) {
          // If White, row index matches PST directly.
          // If Black, we mirror the row coordinate index so black standard home rank evaluates properly
          const pstRow = color === 'w' ? r : (7 - r);
          const pstValue = pstTable[pstRow][c] || 0;
          value += pstValue;
        }

        // Aggregate score
        if (color === 'w') {
          evaluation += value;
        } else {
          evaluation -= value;
        }
      }
    }

    return evaluation;
  }

  /**
   * Minimax search with alpha-beta pruning.
   * Returns: { score: number, move: Move }
   */
  static minimax(game, depth, alpha, beta, isMaximizing) {
    // Check base game ending or depth limits
    const endState = game.getGameOverState();
    if (endState.over) {
      if (endState.reason === 'checkmate') {
        // High score penalty/award based on who won
        return { score: endState.winner === 'w' ? 100000 + depth : -100000 - depth, move: null };
      }
      return { score: 0, move: null }; // Draw scenarios
    }

    if (depth === 0) {
      return { score: this.evaluate(game.board), move: null };
    }

    const legalMoves = game.getAllLegalMoves();
    if (legalMoves.length === 0) {
      // Should not be possible if getGameOverState wasn't triggered, but safeguard:
      return { score: game.isInCheck(game.turn) ? (isMaximizing ? -100000 : 100000) : 0, move: null };
    }

    // Sort moves to optimize alpha-beta pruning (captures first)
    legalMoves.sort((a, b) => {
      const aDest = game.board[a.to.r][a.to.c];
      const bDest = game.board[b.to.r][b.to.c];
      const aVal = aDest ? PIECE_VALUES[aDest.type] : 0;
      const bVal = bDest ? PIECE_VALUES[bDest.type] : 0;
      return bVal - aVal;
    });

    let bestMove = null;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        // Simulate Move
        game.makeMove(move, 'q'); // AI always promotes to Queen

        const evaluation = this.minimax(game, depth - 1, alpha, beta, false).score;

        // Undo simulated move
        game.undo();

        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestMove = move;
        }
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) {
          break; // Beta cut-off
        }
      }
      return { score: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        // Simulate Move
        game.makeMove(move, 'q'); // AI always promotes to Queen

        const evaluation = this.minimax(game, depth - 1, alpha, beta, true).score;

        // Undo simulated move
        game.undo();

        if (evaluation < minEval) {
          minEval = evaluation;
          bestMove = move;
        }
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) {
          break; // Alpha cut-off
        }
      }
      return { score: minEval, move: bestMove };
    }
  }

  /**
   * Formulates the best move for the active AI player.
   * If there are no legal moves, returns null.
   * Uses asynchronous structure so the browser does not freeze.
   */
  static getBestMove(game, depth) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isWhite = game.turn === 'w';
        const searchResult = this.minimax(game, depth, -Infinity, Infinity, isWhite);
        resolve(searchResult.move);
      }, 50); // slight timeout to allow UI updates/spinners to render
    });
  }
}

export default ChessAI;
