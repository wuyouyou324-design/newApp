/**
 * js/constants.js
 * Contains SVGs, AI piece weights, standard piece-square tables, and state defaults.
 */

// Simple flat SVG piece paths with consistent viewBox and styles
export const PIECE_SVGS = {
  w: {
    p: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.62-1.41 1.61-1.41 2.72 0 1.93 1.57 3.5 3.5 3.5h4c1.93 0 3.5-1.57 3.5-3.5 0-1.11-.58-2.1-1.41-2.72C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    r: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M9 39h27v-3H9v3zm3-13v7h21v-7H12zm2.5-11h16l1.5 8h-19l1.5-8zM12 9v4h4V9h3v4h7V9h3v4h4V9h3v4h3V9h-3V7H12v2z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    n: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22 10c-3.87 0-7 3.13-7 7 0 1.25.33 2.43.91 3.47L13 25l3 5 4-2c1.23.97 2.78 1.58 4.47 1.91l.53 4.09h6l.53-4.09c3.09-.6 5.56-2.85 6.28-5.82l-3.81-1.91 1.94-3.87c.71-.97 1.09-2.16 1.09-3.41 0-3.87-3.13-7-7-7z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    b: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 8s-5 4-5 8.5c0 1.5 1 2.5 2 4.5s-.5 4.5-.5 4.5h7s-1.5-2.5-.5-4.5 2-3 2-4.5c0-4.5-5-8.5-5-8.5z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/><circle cx="22.5" cy="5" r="2" fill="#fff" stroke="#000" stroke-width="1.5"/><path d="M17.5 29.5h10v3h-10z" fill="#fff" stroke="#000" stroke-width="1.5"/></svg>`,
    q: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M9 26c0 2 1.5 3 3.5 3h21c2 0 3.5-1 3.5-3 0-2.5-4-11-4-11s-2 5-3 5-3-7-4-7-3 7-4 7-3-5-3-5-4 8.5-4 11zm3-15c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm10.5 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm10.5 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9 33h27v3H9v-3z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    k: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 11.5V6M20 8h5M11.5 30c0-6 4.5-12.5 11-12.5S33.5 24 33.5 30H11.5zm11-8.5V30m-4-5.5h8M11.5 35h22v3h-22v-3z" fill="none" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.5 30c0-6 4.5-12.5 11-12.5S33.5 24 33.5 30H11.5z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>`
  },
  b: {
    p: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-.83.62-1.41 1.61-1.41 2.72 0 1.93 1.57 3.5 3.5 3.5h4c1.93 0 3.5-1.57 3.5-3.5 0-1.11-.58-2.1-1.41-2.72C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#313131" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    r: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M9 39h27v-3H9v3zm3-13v7h21v-7H12zm2.5-11h16l1.5 8h-19l1.5-8zM12 9v4h4V9h3v4h7V9h3v4h4V9h3v4h3V9h-3V7H12v2z" fill="#313131" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    n: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22 10c-3.87 0-7 3.13-7 7 0 1.25.33 2.43.91 3.47L13 25l3 5 4-2c1.23.97 2.78 1.58 4.47 1.91l.53 4.09h6l.53-4.09c3.09-.6 5.56-2.85 6.28-5.82l-3.81-1.91 1.94-3.87c.71-.97 1.09-2.16 1.09-3.41 0-3.87-3.13-7-7-7z" fill="#313131" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    b: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 8s-5 4-5 8.5c0 1.5 1 2.5 2 4.5s-.5 4.5-.5 4.5h7s-1.5-2.5-.5-4.5 2-3 2-4.5c0-4.5-5-8.5-5-8.5z" fill="#313131" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><circle cx="22.5" cy="5" r="2" fill="#313131" stroke="#fff" stroke-width="1.5"/><path d="M17.5 29.5h10v3h-10z" fill="#313131" stroke="#fff" stroke-width="1.5"/></svg>`,
    q: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M9 26c0 2 1.5 3 3.5 3h21c2 0 3.5-1 3.5-3 0-2.5-4-11-4-11s-2 5-3 5-3-7-4-7-3 7-4 7-3-5-3-5-4 8.5-4 11zm3-15c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm10.5 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm10.5 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9 33h27v3H9v-3z" fill="#313131" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    k: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 11.5V6M20 8h5M11.5 30c0-6 4.5-12.5 11-12.5S33.5 24 33.5 30H11.5zm11-8.5V30m-4-5.5h8M11.5 35h22v3h-22v-3z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.5 30c0-6 4.5-12.5 11-12.5S33.5 24 33.5 30H11.5z" fill="#313131" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`
  }
};

// Static Evaluation Piece Values (Standard 100x values for engine integer arithmetic)
export const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece-Square Tables (PST) adapted for 8x8 arrays (Top of array is 8th rank for White, bottom is 1st rank)
// So we use standard tables. Since index 0 is high rank, we represent tables accordingly.
// Let's index standard matrices where array index [0] corresponds to row 0 (which is rank 8 in standard board coordinates).
// If White pieces are evaluated, row 7 is white's home rank (index 7).
// If Black pieces are evaluated, we mirror the table row-wise so row 0 is black's home rank (index 0).

const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

// King middle game table
const KING_MIDDLE_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

export const PST = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
  r: ROOK_PST,
  q: QUEEN_PST,
  k: KING_MIDDLE_PST
};

// Initial state board array (Standard starting positions)
// Row 0 is the 8th Rank (Black side)
// Row 7 is the 1st Rank (White side)
// Null indicates an empty cell
export const INITIAL_BOARD = [
  [
    { type: 'r', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'k', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'r', color: 'b' }
  ],
  [
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' }
  ],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' }
  ],
  [
    { type: 'r', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'k', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'r', color: 'w' }
  ]
];
