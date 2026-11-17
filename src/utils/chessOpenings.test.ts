import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHESS_OPENINGS,
  algebraicToCoords,
  createInitialBoard,
  getBoardSnapshot,
} from './chessOpenings';

test('createInitialBoard places 32 pieces in standard starting squares', () => {
  const board = createInitialBoard();
  assert.equal(board.length, 8);
  assert.deepEqual(board[0][0], { color: 'b', type: 'R' });
  assert.deepEqual(board[0][4], { color: 'b', type: 'K' });
  assert.deepEqual(board[7][4], { color: 'w', type: 'K' });
  assert.deepEqual(board[7][6], { color: 'w', type: 'N' });
  assert.equal(board[4][4], null);
});

test('algebraicToCoords converts e4 and c5 accurately', () => {
  assert.deepEqual(algebraicToCoords('e4'), [4, 4]);
  assert.deepEqual(algebraicToCoords('c5'), [3, 2]);
  assert.deepEqual(algebraicToCoords('a8'), [0, 0]);
  assert.deepEqual(algebraicToCoords('h1'), [7, 7]);
});

test('Apertura Italiana moves knight and bishop to f3 and c4 by step 5', () => {
  const italian = CHESS_OPENINGS.find((o) => o.id === 'italiana');
  assert.ok(italian);

  const snapshot = getBoardSnapshot(italian, 5);
  assert.equal(snapshot.currentMoveIndex, 5);
  assert.equal(snapshot.activeNotation, '3. Ac4');

  // White bishop moved from f1 (7,5) to c4 (4,2)
  assert.deepEqual(snapshot.board[4][2], { color: 'w', type: 'B' });
  assert.equal(snapshot.board[7][5], null);

  // White knight moved from g1 (7,6) to f3 (5,5)
  assert.deepEqual(snapshot.board[5][5], { color: 'w', type: 'N' });
  assert.equal(snapshot.board[7][6], null);
});

test('Defensa Siciliana handles cxd4 capture cleanly at step 6', () => {
  const sicilian = CHESS_OPENINGS.find((o) => o.id === 'siciliana');
  assert.ok(sicilian);

  const snapshot = getBoardSnapshot(sicilian, 6);
  assert.equal(snapshot.activeNotation, '3... cxd4');
  // Black pawn captured on d4 (row 4, col 3) and left c5 (row 3, col 2) empty
  assert.deepEqual(snapshot.board[4][3], { color: 'b', type: 'P' });
  assert.equal(snapshot.board[3][2], null);
});

test('getBoardSnapshot clamps out-of-range steps safely', () => {
  const queensGambit = CHESS_OPENINGS[1];
  const low = getBoardSnapshot(queensGambit, -5);
  assert.equal(low.currentMoveIndex, 0);
  assert.equal(low.activeNotation, 'Inicio');

  const high = getBoardSnapshot(queensGambit, 999);
  assert.equal(high.currentMoveIndex, queensGambit.moves.length);
});
