export type PieceColor = 'w' | 'b';
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

export interface ChessPiece {
  color: PieceColor;
  type: PieceType;
}

export type BoardSquare = ChessPiece | null;
export type ChessBoardState = BoardSquare[][]; // [row 0..7 (rank 8..1)][col 0..7 (file a..h)]

export interface OpeningMove {
  notation: string;
  from: string;
  to: string;
  comment: string;
  isCastleKingSide?: boolean;
}

export interface ChessOpening {
  id: string;
  name: string;
  eco: string;
  tagline: string;
  initialComment: string;
  moves: OpeningMove[];
}

export interface BoardSnapshot {
  board: ChessBoardState;
  lastFrom: [number, number] | null;
  lastTo: [number, number] | null;
  currentMoveIndex: number;
  totalMoves: number;
  activeNotation: string;
  comment: string;
}

export const CHESS_OPENINGS: ChessOpening[] = [
  {
    id: 'italiana',
    name: 'Apertura Italiana',
    eco: 'C50 · Clásica',
    tagline: 'Desarrollo armónico y presión directa sobre f7.',
    initialComment:
      'Posición inicial. La Apertura Italiana prioriza el control rápido del centro y el desarrollo natural de piezas menores.',
    moves: [
      {
        notation: '1. e4',
        from: 'e2',
        to: 'e4',
        comment: 'Las blancas reclaman el centro y abren líneas para el alfil y la dama.',
      },
      {
        notation: '1... e5',
        from: 'e7',
        to: 'e5',
        comment: 'Respuesta simétrica que disputa la casilla d4 y libera el alfil oscuro.',
      },
      {
        notation: '2. Cf3',
        from: 'g1',
        to: 'f3',
        comment: 'Desarrollo activo: el caballo ataca e5 y prepara el enroque corto.',
      },
      {
        notation: '2... Cc6',
        from: 'b8',
        to: 'c6',
        comment: 'Las negras defienden el peón central mientras ganan presencia en d4.',
      },
      {
        notation: '3. Ac4',
        from: 'f1',
        to: 'c4',
        comment: 'La jugada característica italiana: el alfil apunta al punto vulnerable f7.',
      },
      {
        notation: '3... Ac5',
        from: 'f8',
        to: 'c5',
        comment: 'Giuoco Piano: equilibrio tenso y batalla estratégica por la columna central.',
      },
    ],
  },
  {
    id: 'gambito-dama',
    name: 'Gambito de Dama',
    eco: 'D06 · Posicional',
    tagline: 'Sacrificio temporal de flanco para dominar el centro.',
    initialComment:
      'Posición inicial. El Gambito de Dama refleja paciencia estructural: ceder un peón lateral a cambio de iniciativa central.',
    moves: [
      {
        notation: '1. d4',
        from: 'd2',
        to: 'd4',
        comment: 'Control sólido del centro con protección inmediata de la dama.',
      },
      {
        notation: '1... d5',
        from: 'd7',
        to: 'd5',
        comment: 'Las negras fijan la estructura central e impiden e4 sin preparación.',
      },
      {
        notation: '2. c4',
        from: 'c2',
        to: 'c4',
        comment: 'El gambito: ofrece el peón de flanco para desviar al peón negro de d5.',
      },
      {
        notation: '2... e6',
        from: 'e7',
        to: 'e6',
        comment: 'Gambito de Dama Rehusado: consolida d5 y mantiene la solidez.',
      },
      {
        notation: '3. Cc3',
        from: 'b1',
        to: 'c3',
        comment: 'Aumenta la presión sobre d5 y controla e4 antes de definir el alfil.',
      },
      {
        notation: '3... Cf6',
        from: 'g8',
        to: 'f6',
        comment: 'Refuerza la defensa central y prepara el desarrollo del flanco de rey.',
      },
    ],
  },
  {
    id: 'siciliana',
    name: 'Defensa Siciliana',
    eco: 'B50 · Táctica',
    tagline: 'Asimetría calculada para buscar contrajuego ganador.',
    initialComment:
      'Posición inicial. La Defensa Siciliana rompe la simetría desde el primer turno para crear desequilibrios dinámicos.',
    moves: [
      {
        notation: '1. e4',
        from: 'e2',
        to: 'e4',
        comment: 'Inicio agresivo por la columna de rey.',
      },
      {
        notation: '1... c5',
        from: 'c7',
        to: 'c5',
        comment: 'Las negras luchan por d4 desde el flanco, buscando una columna c semiabierta.',
      },
      {
        notation: '2. Cf3',
        from: 'g1',
        to: 'f3',
        comment: 'Prepara el avance temático d4 con apoyo de caballo.',
      },
      {
        notation: '2... d6',
        from: 'd7',
        to: 'd6',
        comment: 'Controla e5 y prepara la estructura flexible tipo Najdorf o Dragón.',
      },
      {
        notation: '3. d4',
        from: 'd2',
        to: 'd4',
        comment: 'Ruptura central directa para abrir diagonales de ataque.',
      },
      {
        notation: '3... cxd4',
        from: 'c5',
        to: 'd4',
        comment: 'Intercambio clave: las negras cambian un peón lateral por uno central.',
      },
      {
        notation: '4. Cxd4',
        from: 'f3',
        to: 'd4',
        comment: 'El caballo ocupa una casilla central dominante con amplio radio táctico.',
      },
    ],
  },
];

const BACK_RANK: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

export function createInitialBoard(): ChessBoardState {
  const board: ChessBoardState = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  );

  for (let col = 0; col < 8; col++) {
    board[0][col] = { color: 'b', type: BACK_RANK[col] };
    board[1][col] = { color: 'b', type: 'P' };
    board[6][col] = { color: 'w', type: 'P' };
    board[7][col] = { color: 'w', type: BACK_RANK[col] };
  }

  return board;
}

export function algebraicToCoords(square: string): [number, number] {
  if (!/^[a-h][1-8]$/.test(square)) {
    throw new Error(`Casilla algebraica inválida: ${square}`);
  }
  const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = Number(square[1]);
  const row = 8 - rank;
  return [row, col];
}

export function cloneBoard(board: ChessBoardState): ChessBoardState {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function applyOpeningMove(board: ChessBoardState, move: OpeningMove): ChessBoardState {
  const next = cloneBoard(board);
  const [fromRow, fromCol] = algebraicToCoords(move.from);
  const [toRow, toCol] = algebraicToCoords(move.to);

  const piece = next[fromRow][fromCol];
  if (!piece) {
    return next;
  }

  next[toRow][toCol] = piece;
  next[fromRow][fromCol] = null;

  if (move.isCastleKingSide && piece.type === 'K') {
    const rook = next[fromRow][7];
    if (rook) {
      next[fromRow][5] = rook;
      next[fromRow][7] = null;
    }
  }

  return next;
}

export function getBoardSnapshot(opening: ChessOpening, stepIndex: number): BoardSnapshot {
  const totalMoves = opening.moves.length;
  const clampedStep = Math.max(0, Math.min(stepIndex, totalMoves));

  let board = createInitialBoard();
  let lastFrom: [number, number] | null = null;
  let lastTo: [number, number] | null = null;

  for (let i = 0; i < clampedStep; i++) {
    const move = opening.moves[i];
    board = applyOpeningMove(board, move);
    lastFrom = algebraicToCoords(move.from);
    lastTo = algebraicToCoords(move.to);
  }

  const activeMove = clampedStep > 0 ? opening.moves[clampedStep - 1] : null;

  return {
    board,
    lastFrom,
    lastTo,
    currentMoveIndex: clampedStep,
    totalMoves,
    activeNotation: activeMove ? activeMove.notation : 'Inicio',
    comment: activeMove ? activeMove.comment : opening.initialComment,
  };
}

export function clampStep(step: number, totalMoves: number): number {
  return Math.max(0, Math.min(step, totalMoves));
}
