// ═══════════════════════════════════════════════════════
// CHESS ENGINE
// ═══════════════════════════════════════════════════════
const SYM = { white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" }, black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" } };
const BACK_RANK = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
const FILES_STR = "abcdefgh";
const SQ = 68;
const PIECE_VALUES = { pawn: 100, knight: 300, bishop: 310, rook: 500, queen: 900, king: 0 };

function createPiece(type, color) { return { type, color, hasMoved: false } }
function idx(col, row) { return col + row * 8 }
function inB(c, r) { return c >= 0 && c < 8 && r >= 0 && r < 8 }
function freshBoard() { const g = Array(64).fill(null); BACK_RANK.forEach((t, c) => { g[idx(c, 0)] = createPiece(t, "black"); g[idx(c, 7)] = createPiece(t, "white") }); for (let c = 0; c < 8; c++) { g[idx(c, 1)] = createPiece("pawn", "black"); g[idx(c, 6)] = createPiece("pawn", "white") } return g }
function cloneGrid(g) { return g.map(p => p ? { ...p } : null) }
function squareToAlg(col, row) { return FILES_STR[col] + (8 - row) }
function slideMoves(g, col, row, piece, dirs) { const s = new Set(); for (const [dc, dr] of dirs) { for (let i = 1; i < 8; i++) { const nc = col + dc * i, nr = row + dr * i; if (!inB(nc, nr)) break; const t = g[idx(nc, nr)]; if (!t) s.add(idx(nc, nr)); else { if (t.color !== piece.color) s.add(idx(nc, nr)); break } } } return [...s] }
function pseudoLegal(g, col, row, piece, ms) { if (!piece) return []; const s = new Set(); switch (piece.type) { case "pawn": { const dir = piece.color === "white" ? -1 : 1, sr = piece.color === "white" ? 6 : 1; if (inB(col, row + dir) && !g[idx(col, row + dir)]) { s.add(idx(col, row + dir)); if (row === sr && !g[idx(col, row + 2 * dir)]) s.add(idx(col, row + 2 * dir)) } for (const dc of [-1, 1]) { const nc = col + dc, nr = row + dir; if (!inB(nc, nr)) continue; const t = g[idx(nc, nr)]; if (t && t.color !== piece.color) s.add(idx(nc, nr)); const last = ms[ms.length - 1]; if (last && last.movingPiece.type === "pawn" && Math.abs(last.fromRow - last.toRow) === 2 && last.toRow === row && last.toCol === nc) s.add(idx(nc, nr)) } break } case "knight": for (const [dc, dr] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) { const nc = col + dc, nr = row + dr; if (!inB(nc, nr)) continue; const t = g[idx(nc, nr)]; if (!t || t.color !== piece.color) s.add(idx(nc, nr)) } break; case "bishop": return slideMoves(g, col, row, piece, [[-1, -1], [-1, 1], [1, -1], [1, 1]]); case "rook": return slideMoves(g, col, row, piece, [[-1, 0], [1, 0], [0, -1], [0, 1]]); case "queen": return [...new Set([...slideMoves(g, col, row, piece, [[-1, -1], [-1, 1], [1, -1], [1, 1]]), ...slideMoves(g, col, row, piece, [[-1, 0], [1, 0], [0, -1], [0, 1]])])]; case "king": { const enemy = piece.color === "white" ? "black" : "white"; for (let dx = -1; dx <= 1; dx++)for (let dy = -1; dy <= 1; dy++) { if (dx === 0 && dy === 0) continue; const nc = col + dx, nr = row + dy; if (!inB(nc, nr)) continue; const t = g[idx(nc, nr)]; if (!t || t.color !== piece.color) s.add(idx(nc, nr)) } if (!piece.hasMoved && !isInCheck(g, piece.color, ms)) { if (!g[idx(col + 1, row)] && !g[idx(col + 2, row)] && !sqAttacked(g, col + 1, row, enemy, ms) && !sqAttacked(g, col + 2, row, enemy, ms)) { const r = g[idx(col + 3, row)]; if (r && r.type === "rook" && !r.hasMoved) s.add(idx(col + 2, row)) } if (!g[idx(col - 1, row)] && !g[idx(col - 2, row)] && !g[idx(col - 3, row)] && !sqAttacked(g, col - 1, row, enemy, ms) && !sqAttacked(g, col - 2, row, enemy, ms)) { const r = g[idx(col - 4, row)]; if (r && r.type === "rook" && !r.hasMoved) s.add(idx(col - 2, row)) } } break } } return [...s] }
function sqAttacked(g, col, row, byColor, ms) { for (let r = 0; r < 8; r++)for (let c = 0; c < 8; c++) { const p = g[idx(c, r)]; if (!p || p.color !== byColor) continue; if (p.type === "pawn") { const dir = byColor === "white" ? -1 : 1; if (r + dir === row && (c - 1 === col || c + 1 === col)) return true; continue } if (p.type === "king") { if (Math.abs(c - col) <= 1 && Math.abs(r - row) <= 1 && (c !== col || r !== row)) return true; continue } if (pseudoLegal(g, c, r, p, ms).includes(idx(col, row))) return true } return false }
function isInCheck(g, color, ms) { for (let r = 0; r < 8; r++)for (let c = 0; c < 8; c++) { const p = g[idx(c, r)]; if (p && p.color === color && p.type === "king") return sqAttacked(g, c, r, color === "white" ? "black" : "white", ms) } return false }
function legalMoves(g, col, row, piece, ms) { return pseudoLegal(g, col, row, piece, ms).filter(ti => { const g2 = cloneGrid(g); applyMove(g2, col, row, ti % 8, Math.floor(ti / 8), [], false); return !isInCheck(g2, piece.color, ms) }) }
function hasAnyLegal(g, color, ms) { for (let r = 0; r < 8; r++)for (let c = 0; c < 8; c++) { const p = g[idx(c, r)]; if (p && p.color === color && legalMoves(g, c, r, p, ms).length > 0) return true } return false }
function applyMove(g, fromCol, fromRow, toCol, toRow, stack, push = true) { const fi = idx(fromCol, fromRow), ti = idx(toCol, toRow); const move = { fromCol, fromRow, toCol, toRow, movingPiece: g[fi], capturedPiece: g[ti], special: "", movedBefore: g[fi].hasMoved }; if (move.movingPiece.type === "king") { if (fromCol + 2 === toCol) { g[idx(toCol - 1, toRow)] = g[idx(7, toRow)]; g[idx(7, toRow)] = null; g[idx(toCol - 1, toRow)].hasMoved = true; move.special = "short castle" } if (fromCol - 2 === toCol) { g[idx(toCol + 1, toRow)] = g[idx(0, toRow)]; g[idx(0, toRow)] = null; g[idx(toCol + 1, toRow)].hasMoved = true; move.special = "long castle" } } if (move.movingPiece.type === "pawn" && toCol !== fromCol && !g[ti]) { const dir = move.movingPiece.color === "white" ? 1 : -1; move.capturedPiece = g[idx(toCol, toRow + dir)]; g[idx(toCol, toRow + dir)] = null; move.special = "en passant" } g[fi] = null; g[ti] = { ...move.movingPiece, hasMoved: true }; if (push) stack.push(move); return move }
function undoMoveFromStack(g, stack) { if (!stack.length) return; const m = stack.pop(); const fi = idx(m.fromCol, m.fromRow), ti = idx(m.toCol, m.toRow); g[fi] = { ...m.movingPiece }; g[ti] = m.capturedPiece ? { ...m.capturedPiece } : null; if (m.special === "en passant") { const dir = m.movingPiece.color === "white" ? 1 : -1; g[idx(m.toCol, m.toRow + dir)] = { ...m.capturedPiece }; g[ti] = null } if (m.special === "short castle") { g[idx(7, m.fromRow)] = { ...g[idx(m.toCol - 1, m.fromRow)], hasMoved: false }; g[idx(m.toCol - 1, m.fromRow)] = null } if (m.special === "long castle") { g[idx(0, m.fromRow)] = { ...g[idx(m.toCol + 1, m.fromRow)], hasMoved: false }; g[idx(m.toCol + 1, m.fromRow)] = null } }
function generateFEN(g, turn, ms) { let fen = ""; for (let row = 0; row < 8; row++) { let empty = 0; for (let col = 0; col < 8; col++) { const p = g[idx(col, row)]; if (!p) { empty++; continue } if (empty > 0) { fen += empty; empty = 0 } const l = { pawn: "p", rook: "r", knight: "n", bishop: "b", queen: "q", king: "k" }[p.type]; fen += p.color === "white" ? l.toUpperCase() : l } if (empty > 0) fen += empty; if (row !== 7) fen += "/" } fen += turn % 2 === 0 ? " w " : " b "; let castling = ""; const wk = g[idx(4, 7)], bk = g[idx(4, 0)]; if (wk && wk.type === "king" && !wk.hasMoved) { if (g[idx(7, 7)] && g[idx(7, 7)].type === "rook" && !g[idx(7, 7)].hasMoved) castling += "K"; if (g[idx(0, 7)] && g[idx(0, 7)].type === "rook" && !g[idx(0, 7)].hasMoved) castling += "Q" } if (bk && bk.type === "king" && !bk.hasMoved) { if (g[idx(7, 0)] && g[idx(7, 0)].type === "rook" && !g[idx(7, 0)].hasMoved) castling += "k"; if (g[idx(0, 0)] && g[idx(0, 0)].type === "rook" && !g[idx(0, 0)].hasMoved) castling += "q" } fen += (castling || "-") + " "; let ep = "-"; const last = ms[ms.length - 1]; if (last && last.movingPiece.type === "pawn" && Math.abs(last.fromRow - last.toRow) === 2) { const er = last.movingPiece.color === "white" ? last.toRow + 1 : last.toRow - 1; ep = squareToAlg(last.toCol, er) } fen += ep + " 0 " + (Math.floor(turn / 2) + 1); return fen }
function buildSAN(g, fc, fr, tc, tr, piece, ms) {
    if (piece.type === "king" && fc + 2 === tc) return "O-O";
    if (piece.type === "king" && fc - 2 === tc) return "O-O-O";
    const letters = { knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K", pawn: "" };
    const cap = g[idx(tc, tr)] !== null;
    const toAlg = squareToAlg(tc, tr);
    if (piece.type === "pawn") return cap ? FILES_STR[fc] + "x" + toAlg : toAlg;
    const cands = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = g[idx(c, r)]; if (!p || p.color !== piece.color || p.type !== piece.type) continue; if (legalMoves(g, c, r, p, ms).includes(idx(tc, tr))) cands.push({ c, r }) }
    let dis = "";
    if (cands.length > 1) { const same = cands.filter(x => x.c === fc); if (same.length > 1) dis += (8 - fr); else dis += FILES_STR[fc] }
    return letters[piece.type] + dis + (cap ? "x" : "") + toAlg;
}
function getSuffix(g, turn, ms) { const color = turn % 2 === 0 ? "white" : "black"; const inCk = isInCheck(g, color, ms); if (!inCk) return ""; return hasAnyLegal(g, color, ms) ? "+" : "#" }

// ═══════════════════════════════════════════════════════
// PGN PARSER
// ═══════════════════════════════════════════════════════
function parsePGN(pgn) { const tags = {}; const tagRe = /\[(\w+)\s+"([^"]*)"\]/g; let m; while ((m = tagRe.exec(pgn)) !== null) tags[m[1]] = m[2]; let moves = pgn.replace(/\[.*?\]/gs, "").replace(/\{[^}]*\}/gs, " ").replace(/;[^\n]*/g, " ").trim(); moves = moves.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, "").trim(); return { tags, tokens: tokenizeMoves(moves) } }
function tokenizeMoves(str) { const result = []; let i = 0; const s = str.trim(); while (i < s.length) { while (i < s.length && /\s/.test(s[i])) i++; if (i >= s.length) break; if (s[i] === "(") { result.push({ type: "varOpen" }); i++; continue } if (s[i] === ")") { result.push({ type: "varClose" }); i++; continue } if (/\d/.test(s[i])) { while (i < s.length && /[\d.]/.test(s[i])) i++; while (i < s.length && /[\s.]/.test(s[i])) i++; continue } if (s[i] === "$") { i++; while (i < s.length && /\d/.test(s[i])) i++; continue } if (/[!?]/.test(s[i])) { let a = ""; while (i < s.length && /[!?]/.test(s[i])) { a += s[i]; i++ } if (result.length > 0 && result[result.length - 1].type === "move") result[result.length - 1].annotation = a; continue } let tok = ""; while (i < s.length && !/[\s(){}]/.test(s[i])) { tok += s[i]; i++ } if (tok) result.push({ type: "move", value: tok }) } return result }
function buildMoveTree(tokens) { const root = []; const stack = [root]; let cur = root; for (const tok of tokens) { if (tok.type === "move") { cur.push({ san: tok.value, annotation: tok.annotation || "", variations: [] }) } else if (tok.type === "varOpen") { if (cur.length > 0) { const vl = []; cur[cur.length - 1].variations.push(vl); stack.push(cur); cur = vl } } else if (tok.type === "varClose") { cur = stack.pop() || root } } return root }
function resolveSAN(san, g, color, ms) { san = san.replace(/[+#]/g, ""); const promo = san.match(/=([QRBN])/); san = san.replace(/=[QRBN]/, ""); if (san === "O-O" || san === "0-0") { const row = color === "white" ? 7 : 0; return { fromCol: 4, fromRow: row, toCol: 6, toRow: row, promo: null } } if (san === "O-O-O" || san === "0-0-0") { const row = color === "white" ? 7 : 0; return { fromCol: 4, fromRow: row, toCol: 2, toRow: row, promo: null } } let pieceType = "pawn", fromFile = null, fromRank = null, toAlg; let rest = san; if (/^[KQRBN]/.test(rest)) { pieceType = { K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight" }[rest[0]]; rest = rest.slice(1) } rest = rest.replace("x", ""); toAlg = rest.slice(-2); rest = rest.slice(0, -2); if (rest.length === 1) { if (/[a-h]/.test(rest)) fromFile = FILES_STR.indexOf(rest); else fromRank = 8 - parseInt(rest) } if (rest.length === 2) { fromFile = FILES_STR.indexOf(rest[0]); fromRank = 8 - parseInt(rest[1]) } const tCol = FILES_STR.indexOf(toAlg[0]), tRow = 8 - parseInt(toAlg[1]); if (tCol < 0 || tRow < 0) return null; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = g[idx(c, r)]; if (!p || p.color !== color || p.type !== pieceType) continue; if (fromFile !== null && c !== fromFile) continue; if (fromRank !== null && r !== fromRank) continue; const moves = legalMoves(g, c, r, p, ms); if (moves.includes(idx(tCol, tRow))) return { fromCol: c, fromRow: r, toCol: tCol, toRow: tRow, promo: promo ? promo[1].toLowerCase() : null } } return null }
function buildPositions(moveTree) { const positions = []; let g = freshBoard(), ms = [], turn = 0; positions.push({ grid: cloneGrid(g), moveStack: [...ms], turn }); for (const node of moveTree) { const color = turn % 2 === 0 ? "white" : "black"; const coords = resolveSAN(node.san, g, color, ms); if (!coords) { console.warn("SAN error:", node.san); turn++; continue } applyMove(g, coords.fromCol, coords.fromRow, coords.toCol, coords.toRow, ms); if (coords.promo) { const pm = { q: "queen", r: "rook", b: "bishop", n: "knight" }; g[idx(coords.toCol, coords.toRow)] = createPiece(pm[coords.promo] || "queen", color); g[idx(coords.toCol, coords.toRow)].hasMoved = true } turn++; positions.push({ grid: cloneGrid(g), moveStack: ms.map(m => ({ ...m })), turn, moveFrom: coords.fromCol + "," + coords.fromRow, moveTo: coords.toCol + "," + coords.toRow }) } return positions }

// ═══════════════════════════════════════════════════════
// STOCKFISH MANAGER — single global message handler
// ═══════════════════════════════════════════════════════
let stockfish = null;
let sfReady = false;
let sfBusy = false;
let sfPending = null; // { type, resolve, reject, timeout, fen, stm, goCmd, multiPV, numPV, best, results }

const PREANALYSIS_DEPTH = 20;
let liveTimeMs = 3000;

function sfTerminate() {
    if (stockfish) { try { stockfish.terminate(); } catch (e) { } stockfish = null; }
    sfReady = false; sfBusy = false;
    if (sfPending) { clearTimeout(sfPending.timeout); sfPending.reject("terminated"); sfPending = null; }
}

// ONE global handler — assigned once on init, never overwritten
function sfOnMessage(e) {
    const msg = e.data;

    // uciok → send setoptions then isready
    if (!sfReady && msg === "uciok") {
        stockfish.postMessage("setoption name Hash value 128");
        stockfish.postMessage("setoption name MultiPV value 1");
        stockfish.postMessage("isready");
        return;
    }

    // readyok during init phase
    if (!sfReady && msg === "readyok") {
        sfReady = true;
        if (sfPending?.type === "init") {
            clearTimeout(sfPending.timeout);
            sfPending.resolve();
            sfPending = null;
        }
        return;
    }

    // readyok during search phase → fire position + go
    if (msg === "readyok" && sfPending?.type === "search") {
        stockfish.postMessage("position fen " + sfPending.fen);
        stockfish.postMessage(sfPending.goCmd);
        return;
    }

    if (!sfPending || sfPending.type === "init") return;

    // info lines
    if (msg.startsWith("info") && msg.includes("score") && msg.includes(" pv ")) {
        const cpM = msg.match(/score cp (-?\d+)/);
        const mM = msg.match(/score mate (-?\d+)/);
        const pvM = msg.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (!pvM) return;

        if (sfPending.multiPV) {
            const pvIdxM = msg.match(/multipv (\d+)/);
            if (!pvIdxM) return;
            const pvIdx = parseInt(pvIdxM[1]) - 1;
            let cp = 0, mate = null;
            if (mM) { mate = parseInt(mM[1]); cp = sfPending.stm === "b" ? (mate > 0 ? -10000 : 10000) : (mate > 0 ? 10000 : -10000); }
            else if (cpM) { cp = sfPending.stm === "b" ? -parseInt(cpM[1]) : parseInt(cpM[1]); }
            sfPending.results[pvIdx] = { cp, mate, move: pvM[1] };
        } else {
            sfPending.best.bestMove = pvM[1];
            if (mM) { const mv = parseInt(mM[1]); sfPending.best.mate = sfPending.stm === "b" ? -mv : mv; sfPending.best.cp = sfPending.best.mate > 0 ? 10000 : -10000; }
            else if (cpM) { sfPending.best.cp = sfPending.stm === "b" ? -parseInt(cpM[1]) : parseInt(cpM[1]); sfPending.best.mate = null; }
        }
    }

    // search done
    if (msg.startsWith("bestmove")) {
        if (!sfPending) return;
        clearTimeout(sfPending.timeout);
        const { resolve, multiPV, best, results } = sfPending;
        if (!multiPV) { const m = msg.split(" ")[1]; if (m && m !== "(none)" && m !== "0000") best.bestMove ??= m; }
        sfPending = null; sfBusy = false;
        resolve(multiPV ? results : best);
    }
}

function initStockfish() {
    // Worker bereits bereit — nichts tun
    if (stockfish && sfReady) return Promise.resolve();

    return new Promise((resolve, reject) => {
        if (stockfish) sfTerminate();
        stockfish = new Worker("stockfish-18.js#https://github.com/nmrugg/stockfish.js/releases/download/v18.0.0/stockfish-18.wasm");
        stockfish.onerror = err => {
            console.error("Stockfish worker error:", err);
            const rej = sfPending?.reject || reject;
            sfTerminate();
            rej("worker error");
        };
        stockfish.onmessage = sfOnMessage; // set once, never overwritten
        const timeout = setTimeout(() => { console.error("Stockfish init timeout"); sfTerminate(); reject("init timeout"); }, 60000);
        sfPending = { type: "init", resolve, reject, timeout };
        stockfish.postMessage("uci");
        // isready wird erst nach uciok geschickt (siehe sfOnMessage)
    });
}

async function sfStartSearch(opts) {
    if (!sfReady || !stockfish) { console.warn("Stockfish not ready — restarting..."); await initStockfish(); }
    if (sfBusy) {
        stockfish.postMessage("stop");
        if (sfPending) { clearTimeout(sfPending.timeout); sfPending.reject("cancelled"); sfPending = null; }
        sfBusy = false;
    }
    return new Promise((resolve, reject) => {
        sfBusy = true;
        const safetyMs = opts.movetime ? opts.movetime + 5000 : (opts.depth || 20) * 1500 + 5000;
        const timeout = setTimeout(() => {
            sfBusy = false; sfPending = null;
            resolve(opts.multiPV ? [] : { cp: 0, mate: null, bestMove: null });
        }, safetyMs);
        sfPending = {
            type: "search", resolve, reject, timeout,
            fen: opts.fen, stm: opts.fen.split(" ")[1],
            goCmd: opts.movetime ? "go movetime " + opts.movetime : "go depth " + opts.depth,
            multiPV: opts.multiPV || false,
            best: { cp: 0, mate: null, bestMove: null },
            results: []
        };
        stockfish.postMessage("stop");
        stockfish.postMessage("setoption name MultiPV value " + (opts.numPV || 1));
        if (opts.skillLevel !== undefined) {
            stockfish.postMessage("setoption name UCI_LimitStrength value true");
            stockfish.postMessage("setoption name Skill Level value " + opts.skillLevel);
        } else {
            stockfish.postMessage("setoption name UCI_LimitStrength value false");
            stockfish.postMessage("setoption name Skill Level value 20");
        }
        stockfish.postMessage("isready");
    });
}

function sfEval(fen, { depth = null, movetime = null } = {}) {
    return sfStartSearch({ fen, depth, movetime });
}
function sfEvalMultiPV(fen, depth, numPV) {
    return sfStartSearch({ fen, depth, numPV, multiPV: true });
}
function getBotMove(fen, elo) {
    const skill = Math.min(20, Math.max(0, Math.round((elo - 400) / 90)));
    const moveTime = Math.min(2000, Math.max(100, elo / 2));
    return sfStartSearch({ fen, movetime: moveTime, skillLevel: skill });
}

// ═══════════════════════════════════════════════════════
// SACRIFICE DETECTION (SEE - Static Exchange Eval)
// ═══════════════════════════════════════════════════════
function staticExchangeEval(g, fc, fr, tc, tr, piece, ms) {
    const capturedVal = g[idx(tc, tr)] ? PIECE_VALUES[g[idx(tc, tr)].type] : 0;
    if (capturedVal === 0 && !sqAttacked(g, tc, tr, piece.color === "white" ? "black" : "white", ms)) { return 0; }
    const enemy = piece.color === "white" ? "black" : "white";
    if (!sqAttacked(g, tc, tr, enemy, ms)) return capturedVal;
    return capturedVal - PIECE_VALUES[piece.type];
}
function isSacrifice(g, fc, fr, tc, tr, piece, ms) { return staticExchangeEval(g, fc, fr, tc, tr, piece, ms) < -50; }

// ═══════════════════════════════════════════════════════
// MOVE CLASSIFICATION
// ═══════════════════════════════════════════════════════
function classifyMove(delta, sacrificed, prevEv, currEv, movedColor, playedMoveUCI, engineBestUCI, isOnlyGoodMove) {
    const prevForMover = movedColor === "white" ? prevEv.cp : -prevEv.cp;
    const currForMover = movedColor === "white" ? currEv.cp : -currEv.cp;
    const playedBestMove = playedMoveUCI && engineBestUCI && playedMoveUCI.slice(0, 4) === engineBestUCI.slice(0, 4);
    if (currEv?.mate !== null) { const good = movedColor === "white" ? currEv.mate > 0 : currEv.mate < 0; if (good) return { key: "best", sym: "★", label: "Bester Zug (Matt!)", css: "badge-best" }; }
    if (prevEv?.mate !== null) { const wasBad = movedColor === "white" ? prevEv.mate < 0 : prevEv.mate > 0; if (wasBad && delta < 50) return { key: "good", sym: "·", label: "Gut", css: "badge-good" }; }
    if (sacrificed && delta <= 50) return { key: "brilliant", sym: "!!", label: "Brillant", css: "badge-brilliant" };
    if (playedBestMove) return { key: "best", sym: "★", label: "Bester Zug", css: "badge-best" };
    if (isOnlyGoodMove && delta <= 30) return { key: "great", sym: "!", label: "Großartig", css: "badge-great" };
    if (delta <= 10) return { key: "excellent", sym: "✓", label: "Ausgezeichnet", css: "badge-excellent" };
    if (delta <= 30) return { key: "good", sym: "·", label: "Gut", css: "badge-good" };
    if (prevForMover >= 100 && currForMover <= 0) return { key: "blunder", sym: "??", label: "Grober Fehler", css: "badge-blunder" };
    if (Math.abs(prevForMover) < 100 && currForMover <= -100) return { key: "blunder", sym: "??", label: "Grober Fehler", css: "badge-blunder" };
    if (prevForMover < -100 && delta >= 300) return { key: "blunder", sym: "??", label: "Grober Fehler", css: "badge-blunder" };
    if (currEv?.mate !== null) { const opponentMating = movedColor === "white" ? currEv.mate < 0 : currEv.mate > 0; if (opponentMating) return { key: "blunder", sym: "??", label: "Grober Fehler", css: "badge-blunder" }; }
    if (isOnlyGoodMove && delta > 30) return { key: "missed", sym: "⊘", label: "Verpasste Chance", css: "badge-missed" };
    if (prevForMover >= 100 && currForMover > 0 && delta > 30 && delta <= 200) return { key: "inaccuracy", sym: "?!", label: "Ungenauigkeit", css: "badge-inaccuracy" };
    if (prevForMover < 100 && delta < 100) return { key: "inaccuracy", sym: "?!", label: "Ungenauigkeit", css: "badge-inaccuracy" };
    if (prevForMover >= 100 && currForMover > 0 && delta > 200) return { key: "mistake", sym: "?", label: "Fehler", css: "badge-mistake" };
    if (delta >= 100 && delta < 300) return { key: "mistake", sym: "?", label: "Fehler", css: "badge-mistake" };
    return { key: "blunder", sym: "??", label: "Grober Fehler", css: "badge-blunder" };
}
function evalToLabel(cp) { const a = Math.abs(cp), s = cp >= 0 ? "Weiß" : "Schwarz"; if (a < 20) return "Ausgeglichen"; if (a < 80) return `Leichter Vorteil ${s}`; if (a < 200) return `Klarer Vorteil ${s}`; if (a < 500) return `Großer Vorteil ${s}`; return `Gewinnend für ${s}` }

// ═══════════════════════════════════════════════════════
// BOARD DOM BUILDER
// ═══════════════════════════════════════════════════════
function buildBoardDOM(boardEl, ranksEl, filesEl) { const squares = [], pieces = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const btn = document.createElement("button"); btn.classList.add("square", (r + c) % 2 === 0 ? "light" : "dark"); btn.dataset.row = r; btn.dataset.col = c; const sp = document.createElement("span"); sp.classList.add("piece"); squares.push(btn); pieces.push(sp); btn.appendChild(sp); boardEl.appendChild(btn) } for (let i = 8; i >= 1; i--) { const d = document.createElement("div"); d.textContent = i; ranksEl.appendChild(d) } for (const l of "abcdefgh") { const d = document.createElement("div"); d.textContent = l; filesEl.appendChild(d) } return { squares, pieces } }
function drawGrid(g, squares, pieces) { for (let i = 0; i < 64; i++) { const p = g[i], sp = pieces[i]; if (!p) { sp.textContent = ""; sp.style.visibility = "hidden" } else { sp.textContent = SYM[p.color][p.type]; sp.style.visibility = "visible" } } }
function clearHighlightsBoard(squares) { squares.forEach(sq => { sq.classList.remove("sq-lastmove", "sq-check"); sq.querySelector(".sq-dot")?.remove(); sq.querySelector(".sq-ring")?.remove(); sq.querySelector(".move-badge")?.remove() }) }
function showDotsBoard(g, col, row, piece, ms, squares) { const moves = legalMoves(g, col, row, piece, ms); moves.forEach(ti => { const sq = squares[ti]; const hasPiece = g[ti] !== null; const el = document.createElement("div"); el.className = hasPiece ? "sq-ring" : "sq-dot"; sq.appendChild(el) }); return moves }
function clearDotsBoard(squares) { squares.forEach(sq => { sq.querySelector(".sq-dot")?.remove(); sq.querySelector(".sq-ring")?.remove() }) }
function drawArrowSVG(svgEl, markerId, fromCol, fromRow, toCol, toRow) { svgEl.querySelectorAll(".sf-arrow").forEach(e => e.remove()); const fx = fromCol * SQ + SQ / 2, fy = fromRow * SQ + SQ / 2, tx = toCol * SQ + SQ / 2, ty = toRow * SQ + SQ / 2; const dx = tx - fx, dy = ty - fy, len = Math.sqrt(dx * dx + dy * dy); const ex = tx - (dx / len) * 18, ey = ty - (dy / len) * 18; const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect"); rect.setAttribute("x", fromCol * SQ); rect.setAttribute("y", fromRow * SQ); rect.setAttribute("width", SQ); rect.setAttribute("height", SQ); rect.setAttribute("fill", markerId.includes("red") ? "rgba(220,60,60,0.18)" : "rgba(50,200,100,0.18)"); rect.setAttribute("class", "sf-arrow"); svgEl.appendChild(rect); const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("x1", fx); line.setAttribute("y1", fy); line.setAttribute("x2", ex); line.setAttribute("y2", ey); line.setAttribute("stroke", markerId.includes("red") ? "rgba(220,60,60,0.85)" : markerId.includes("blue") ? "rgba(100,160,240,0.85)" : "rgba(50,200,100,0.85)"); line.setAttribute("stroke-width", "9"); line.setAttribute("stroke-linecap", "round"); line.setAttribute("marker-end", `url(#${markerId})`); line.setAttribute("class", "sf-arrow"); svgEl.appendChild(line) }
function clearArrowSVG(svgEl) { svgEl.querySelectorAll(".sf-arrow").forEach(e => e.remove()) }
function showCheckHl(g, turn, squares) { const color = turn % 2 === 0 ? "white" : "black"; if (!isInCheck(g, color, [])) return; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = g[idx(c, r)]; if (p && p.color === color && p.type === "king") { squares[idx(c, r)].classList.add("sq-check"); return } } }

// ═══════════════════════════════════════════════════════
// LOADING MINI BOARD
// ═══════════════════════════════════════════════════════
(() => { const mini = document.getElementById("loadingMini"); if (!mini) return; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const d = document.createElement("div"); d.className = (r + c) % 2 === 0 ? "l" : "d"; mini.appendChild(d) } })();

// ═══════════════════════════════════════════════════════
// GAME MODE (Bot / Friend)
// ═══════════════════════════════════════════════════════
let gSquares = [], gPieces = [];
const gBoardEl = document.getElementById("gBoard");
const gRanksEl = document.getElementById("gRanksCol");
const gFilesEl = document.getElementById("gFilesRow");
const gSvg = document.getElementById("gArrowLayer");
({ squares: gSquares, pieces: gPieces } = buildBoardDOM(gBoardEl, gRanksEl, gFilesEl));

let gGrid = null, gMoveStack = [], gTurn = 0;
let gMode = "friend";
let gPlayerColor = "white";
let gBotElo = 800;
let gSelectedSq = null;
let gBotThinking = false;
let gGameOver = false;
let gHistory = [];

function gStartGame(mode, playerColor, botElo) {
    gMode = mode; gPlayerColor = playerColor; gBotElo = botElo;
    gGrid = freshBoard(); gMoveStack = []; gTurn = 0;
    gSelectedSq = null; gBotThinking = false; gGameOver = false; gHistory = [];
    document.getElementById("gameOverBanner").classList.remove("show");
    gRenderBoard(); gRenderNotation();
    document.getElementById("gameStatus").textContent = "";
    gSquares.forEach(sq => { const newSq = sq.cloneNode(true); sq.parentNode.replaceChild(newSq, sq); });
    gSquares = Array.from(gBoardEl.querySelectorAll(".square"));
    gPieces = gSquares.map(sq => sq.querySelector(".piece"));
    gSquares.forEach(sq => sq.addEventListener("click", gHandleClick));
    gRenderBoard();
    if (gMode === "bot" && gPlayerColor === "black") { setTimeout(() => gBotMove(), 300); }
}

function gHandleClick(e) {
    if (gGameOver || gBotThinking) return;
    const col = +e.currentTarget.dataset.col, row = +e.currentTarget.dataset.row;
    const turnColor = gTurn % 2 === 0 ? "white" : "black";
    if (gMode === "bot" && turnColor !== gPlayerColor) return;
    if (gSelectedSq === null) {
        const p = gGrid[idx(col, row)];
        if (!p || p.color !== turnColor) return;
        gSelectedSq = { col, row, piece: p };
        gSquares[idx(col, row)].style.outline = "2px solid rgba(100,160,240,0.8)";
        clearDotsBoard(gSquares);
        showDotsBoard(gGrid, col, row, p, gMoveStack, gSquares);
    } else {
        const from = gSelectedSq;
        gSquares[idx(from.col, from.row)].style.outline = "";
        clearDotsBoard(gSquares);
        if (col === from.col && row === from.row) { gSelectedSq = null; return; }
        const tp = gGrid[idx(col, row)];
        if (tp && tp.color === turnColor) {
            gSelectedSq = { col, row, piece: tp };
            gSquares[idx(col, row)].style.outline = "2px solid rgba(100,160,240,0.8)";
            showDotsBoard(gGrid, col, row, tp, gMoveStack, gSquares);
            return;
        }
        const moves = legalMoves(gGrid, from.col, from.row, from.piece, gMoveStack);
        if (!moves.includes(idx(col, row))) { gSelectedSq = null; return; }
        gMakeMove(from.col, from.row, col, row, from.piece);
        gSelectedSq = null;
    }
}

function gMakeMove(fc, fr, tc, tr, piece, promoType = "queen") {
    const san = buildSAN(gGrid, fc, fr, tc, tr, piece, gMoveStack);
    applyMove(gGrid, fc, fr, tc, tr, gMoveStack);
    if (piece.type === "pawn" && (tr === 0 || tr === 7)) { gGrid[idx(tc, tr)] = createPiece(promoType, piece.color); gGrid[idx(tc, tr)].hasMoved = true; }
    gTurn++;
    const suffix = getSuffix(gGrid, gTurn, gMoveStack);
    gHistory.push({ san: san + suffix, fromCol: fc, fromRow: fr, toCol: tc, toRow: tr, suffix });
    gRenderBoard(); gRenderNotation(); gCheckGameOver(suffix);
    if (!gGameOver && gMode === "bot") { const nextColor = gTurn % 2 === 0 ? "white" : "black"; if (nextColor !== gPlayerColor) { setTimeout(() => gBotMove(), 200); } }
}

async function gBotMove() {
    if (gGameOver) return;
    const turnColor = gTurn % 2 === 0 ? "white" : "black";
    if (turnColor === gPlayerColor) return;
    gBotThinking = true;
    document.getElementById("gameStatus").textContent = "Bot denkt…";
    const fen = generateFEN(gGrid, gTurn, gMoveStack);
    const uci = await getBotMove(fen, gBotElo);
    gBotThinking = false;
    document.getElementById("gameStatus").textContent = "";
    if (!uci || gGameOver) return;
    const fc = FILES_STR.indexOf(uci[0]), fr = 8 - parseInt(uci[1]);
    const tc = FILES_STR.indexOf(uci[2]), tr = 8 - parseInt(uci[3]);
    const piece = gGrid[idx(fc, fr)];
    if (!piece) return;
    const promo = uci[4] ? { q: "queen", r: "rook", b: "bishop", n: "knight" }[uci[4]] : "queen";
    gMakeMove(fc, fr, tc, tr, piece, promo);
}

function gCheckGameOver(suffix) {
    const turnColor = gTurn % 2 === 0 ? "white" : "black";
    const inCk = isInCheck(gGrid, turnColor, gMoveStack);
    const hasLegal = hasAnyLegal(gGrid, turnColor, gMoveStack);
    if (!hasLegal) {
        gGameOver = true;
        gSquares.forEach(sq => sq.removeEventListener("click", gHandleClick));
        const banner = document.getElementById("gameOverBanner");
        if (inCk) { const winner = turnColor === "white" ? "Schwarz" : "Weiß"; document.getElementById("gameOverTitle").textContent = "Schachmatt!"; document.getElementById("gameOverSub").textContent = winner + " gewinnt"; }
        else { document.getElementById("gameOverTitle").textContent = "Patt!"; document.getElementById("gameOverSub").textContent = "Unentschieden"; }
        banner.classList.add("show");
    }
}

function gRenderBoard() {
    drawGrid(gGrid, gSquares, gPieces);
    clearHighlightsBoard(gSquares);
    if (gHistory.length > 0) { const last = gHistory[gHistory.length - 1]; gSquares[idx(last.fromCol, last.fromRow)].classList.add("sq-lastmove"); gSquares[idx(last.toCol, last.toRow)].classList.add("sq-lastmove"); }
    showCheckHl(gGrid, gTurn, gSquares);
    const wb = gTurn % 2 === 0;
    document.getElementById("gStripBottom").classList.toggle("active", wb);
    document.getElementById("gStripTop").classList.toggle("active", !wb);
}

function gRenderNotation() {
    const scroll = document.getElementById("gNotationScroll");
    scroll.innerHTML = "";
    let row = null;
    gHistory.forEach((h, i) => {
        if (i % 2 === 0) { row = document.createElement("div"); row.className = "move-row"; const n = document.createElement("span"); n.className = "move-num"; n.textContent = (Math.floor(i / 2) + 1) + "."; row.appendChild(n); scroll.appendChild(row); }
        const tok = document.createElement("span"); tok.className = "move-token"; tok.textContent = h.san; row.appendChild(tok);
    });
    scroll.scrollTop = scroll.scrollHeight;
}

function gUndoMove() {
    if (gGameOver || gBotThinking || gHistory.length === 0) return;
    const undoCount = gMode === "bot" ? Math.min(2, gHistory.length) : 1;
    for (let i = 0; i < undoCount; i++) { if (gHistory.length > 0) { undoMoveFromStack(gGrid, gMoveStack); gHistory.pop(); gTurn--; } }
    gRenderBoard(); gRenderNotation();
    document.getElementById("gameStatus").textContent = "";
    document.getElementById("gameOverBanner").classList.remove("show");
    gGameOver = false;
    gSquares.forEach(sq => sq.removeEventListener("click", gHandleClick));
    gSquares.forEach(sq => sq.addEventListener("click", gHandleClick));
}

function gGameToPGN() {
    let pgn = `[White "${document.getElementById("gNameBottom").textContent}"]\n`;
    pgn += `[Black "${document.getElementById("gNameTop").textContent}"]\n`;
    pgn += `[Result "*"]\n\n`;
    gHistory.forEach((h, n) => { if (n % 2 === 0) pgn += (Math.floor(n / 2) + 1) + ". "; pgn += h.san + " "; });
    return pgn.trim();
}

// ═══════════════════════════════════════════════════════
// ANALYSIS MODE
// ═══════════════════════════════════════════════════════
let aSquares = [], aPieces = [];
const aBoardEl = document.getElementById("aBoard");
const aRanksEl = document.getElementById("aRanksCol");
const aFilesEl = document.getElementById("aFilesRow");
const aSvg = document.getElementById("aArrowLayer");
({ squares: aSquares, pieces: aPieces } = buildBoardDOM(aBoardEl, aRanksEl, aFilesEl));

let pgnTags = {}, moveTree = [], positions = [], evals = [], classifications = [];
let curPos = 0;
let freeGrid = null, freeMoveStack = [], freeMoves = [], freeEvals = [], freeClassifications = [];
let aSelectedSq = null;
let lastKnownEval = null;

function matchesNextPGNMove(fc, fr, tc, tr) {
    if (freeGrid !== null || curPos >= positions.length - 1) return false;
    const nextPos = positions[curPos + 1];
    if (!nextPos || !nextPos.moveFrom || !nextPos.moveTo) return false;
    const [nfc, nfr] = nextPos.moveFrom.split(",").map(Number);
    const [ntc, ntr] = nextPos.moveTo.split(",").map(Number);
    return nfc === fc && nfr === fr && ntc === tc && ntr === tr;
}

function aHandleClick(e) {
    const col = +e.currentTarget.dataset.col, row = +e.currentTarget.dataset.row;
    const curGrid = freeGrid || positions[curPos]?.grid;
    if (!curGrid) return;
    const turn = freeGrid ? positions[curPos].turn + freeMoves.length : positions[curPos].turn;
    const color = turn % 2 === 0 ? "white" : "black";
    if (aSelectedSq === null) {
        const p = curGrid[idx(col, row)];
        if (!p || p.color !== color) return;
        aSelectedSq = { col, row, piece: p };
        aSquares[idx(col, row)].style.outline = "2px solid rgba(100,160,240,0.8)";
        clearDotsBoard(aSquares);
        showDotsBoard(curGrid, col, row, p, freeGrid ? freeMoveStack : positions[curPos].moveStack || [], aSquares);
    } else {
        const from = aSelectedSq;
        aSquares[idx(from.col, from.row)].style.outline = "";
        clearDotsBoard(aSquares);
        if (col === from.col && row === from.row) { aSelectedSq = null; return; }
        const tp = curGrid[idx(col, row)];
        if (tp && tp.color === color) {
            aSelectedSq = { col, row, piece: tp };
            aSquares[idx(col, row)].style.outline = "2px solid rgba(100,160,240,0.8)";
            showDotsBoard(curGrid, col, row, tp, freeGrid ? freeMoveStack : positions[curPos].moveStack || [], aSquares);
            return;
        }
        const ms = freeGrid ? freeMoveStack : positions[curPos].moveStack || [];
        const moves = legalMoves(curGrid, from.col, from.row, from.piece, ms);
        if (!moves.includes(idx(col, row))) { aSelectedSq = null; return; }
        if (freeGrid === null && matchesNextPGNMove(from.col, from.row, col, row)) { aSelectedSq = null; aGoToPosition(curPos + 1); return; }
        const preGrid = cloneGrid(freeGrid || positions[curPos].grid);
        const preMS = (freeGrid ? freeMoveStack : positions[curPos].moveStack || []).map(m => ({ ...m }));
        if (freeGrid === null) { freeGrid = cloneGrid(positions[curPos].grid); freeMoveStack = (positions[curPos].moveStack || []).map(m => ({ ...m })); }
        const san = buildSAN(freeGrid, from.col, from.row, col, row, from.piece, freeMoveStack);
        applyMove(freeGrid, from.col, from.row, col, row, freeMoveStack);
        if (from.piece.type === "pawn" && (row === 0 || row === 7)) { freeGrid[idx(col, row)] = createPiece("queen", color); freeGrid[idx(col, row)].hasMoved = true; }
        const suffix = getSuffix(freeGrid, turn + 1, freeMoveStack);
        freeMoves.push({ san: san + suffix, fromCol: from.col, fromRow: from.row, toCol: col, toRow: row, piece: from.piece, preGrid, preMoveStack: preMS });
        freeEvals.push(null); freeClassifications.push(null);
        aSelectedSq = null;
        aRefreshBoard(); aUpdateNavButtons(); aLiveEvalFree();
    }
}

function aExitFreePlay() {
    if (freeGrid === null) return;
    freeGrid = null; freeMoveStack = []; freeMoves = []; freeEvals = []; freeClassifications = [];
    aSelectedSq = null; clearDotsBoard(aSquares);
}

function aGoToPosition(posIdx) {
    aExitFreePlay();
    posIdx = Math.max(0, Math.min(positions.length - 1, posIdx));
    curPos = posIdx;
    aRefreshBoard(); aUpdateNavButtons();
    aUpdateEvalUI(evals[curPos] || null, false);
    lastKnownEval = evals[curPos] || null;
}

function aLiveEvalFree() {
    const lastFm = freeMoves[freeMoves.length - 1];
    const movedColor = (positions[curPos].turn + freeMoves.length - 1) % 2 === 0 ? "white" : "black";
    const preTurn = positions[curPos].turn + freeMoves.length - 1;
    const preFen = generateFEN(lastFm.preGrid, preTurn, lastFm.preMoveStack);
    aUpdateEvalUI(null, true);
    sfEval(preFen, { movetime: liveTimeMs }).then(prevEv => {
        if (freeGrid === null) return;
        const postTurn = positions[curPos].turn + freeMoves.length;
        const postFen = generateFEN(freeGrid, postTurn, freeMoveStack);
        sfEval(postFen, { movetime: liveTimeMs }).then(ev => {
            if (freeGrid === null) return;
            freeEvals[freeMoves.length - 1] = ev;
            const delta = movedColor === "white" ? (prevEv.cp - ev.cp) : (ev.cp - prevEv.cp);
            const lf = freeMoves[freeMoves.length - 1];
            const sacrificed = isSacrifice(lf.preGrid, lf.fromCol, lf.fromRow, lf.toCol, lf.toRow, lf.piece, lf.preMoveStack);
            const playedUCI = FILES_STR[lf.fromCol] + (8 - lf.fromRow) + FILES_STR[lf.toCol] + (8 - lf.toRow);
            const engineBestUCI = prevEv.bestMove || null;
            const cl = classifyMove(delta, sacrificed, prevEv, ev, movedColor, playedUCI, engineBestUCI, false);
            freeClassifications[freeMoves.length - 1] = cl;
            document.querySelectorAll(".move-badge").forEach(e => e.remove());
            const sq = aSquares[idx(lf.toCol, lf.toRow)];
            const badge = document.createElement("div");
            badge.className = "move-badge " + cl.css; badge.title = cl.label; badge.textContent = cl.sym;
            sq.appendChild(badge);
            aUpdateEvalUI(ev, false); aRenderNotation();
        });
    });
}

function aRefreshBoard() {
    const activeGrid = freeGrid || positions[curPos]?.grid;
    if (!activeGrid) return;
    drawGrid(activeGrid, aSquares, aPieces);
    clearHighlightsBoard(aSquares);
    if (freeGrid) {
        if (freeMoves.length > 0) { const lm = freeMoves[freeMoves.length - 1]; aSquares[idx(lm.fromCol, lm.fromRow)].classList.add("sq-lastmove"); aSquares[idx(lm.toCol, lm.toRow)].classList.add("sq-lastmove"); }
        else { const pos = positions[curPos]; if (pos?.moveFrom) { const [fc, fr] = pos.moveFrom.split(",").map(Number); const [tc, tr] = pos.moveTo.split(",").map(Number); aSquares[idx(fc, fr)].classList.add("sq-lastmove"); aSquares[idx(tc, tr)].classList.add("sq-lastmove"); } }
        showCheckHl(freeGrid, positions[curPos].turn + freeMoves.length, aSquares);
    } else {
        const pos = positions[curPos];
        if (pos) {
            if (pos.moveFrom) { const [fc, fr] = pos.moveFrom.split(",").map(Number); const [tc, tr] = pos.moveTo.split(",").map(Number); aSquares[idx(fc, fr)].classList.add("sq-lastmove"); aSquares[idx(tc, tr)].classList.add("sq-lastmove"); }
            if (curPos > 0 && classifications[curPos]) { const [tc, tr] = positions[curPos].moveTo.split(",").map(Number); const sq = aSquares[idx(tc, tr)]; const cl = classifications[curPos]; const badge = document.createElement("div"); badge.className = "move-badge " + cl.css; badge.title = cl.label; badge.textContent = cl.sym; sq.appendChild(badge); }
            showCheckHl(pos.grid, pos.turn, aSquares);
        }
    }
    clearArrowSVG(aSvg); aRenderNotation(); aUpdatePlayerStrips();
}

function aUpdatePlayerStrips() {
    const turn = freeGrid ? positions[curPos].turn + freeMoves.length : positions[curPos]?.turn || 0;
    document.getElementById("aStripBottom").classList.toggle("active", turn % 2 === 0);
    document.getElementById("aStripTop").classList.toggle("active", turn % 2 !== 0);
}

function aUpdateNavButtons() {
    document.getElementById("aBtnFirst").disabled = curPos === 0 && freeMoves.length === 0;
    document.getElementById("aBtnPrev").disabled = curPos === 0 && freeMoves.length === 0;
    document.getElementById("aBtnNext").disabled = curPos >= positions.length - 1 && freeGrid === null;
    document.getElementById("aBtnLast").disabled = curPos >= positions.length - 1 && freeGrid === null;
}

function aUpdateEvalUI(ev, isAnalysing) {
    const spinner = document.getElementById("spinner");
    spinner.style.display = isAnalysing ? "block" : "none";
    document.getElementById("analysisStatusText").textContent = isAnalysing ? "Analysiert…" : "";
    if (!ev) { document.getElementById("evalScore").textContent = "–"; return; }
    if (!isAnalysing) lastKnownEval = ev;
    let scoreText, labelText, barPct;
    if (ev.mate !== null) {
        const side = ev.mate > 0 ? "Weiß" : "Schwarz";
        scoreText = "M" + Math.abs(ev.mate);
        labelText = "Matt in " + Math.abs(ev.mate) + " · " + side + " gewinnt";
        barPct = ev.mate > 0 ? 95 : 5;
    } else {
        const pawns = ev.cp / 100;
        scoreText = (pawns >= 0 ? "+" : "") + pawns.toFixed(1);
        labelText = evalToLabel(ev.cp);
        barPct = 50 + 50 * (2 / (1 + Math.exp(-0.004 * ev.cp)) - 1);
        barPct = Math.max(3, Math.min(97, barPct));
    }
    document.getElementById("evalScore").textContent = scoreText;
    document.getElementById("evalLabel").textContent = labelText;
    document.getElementById("evalBarFill").style.width = barPct + "%";
    if (ev.bestMove) {
        const fc = FILES_STR.indexOf(ev.bestMove[0]), fr = 8 - parseInt(ev.bestMove[1]);
        const tc = FILES_STR.indexOf(ev.bestMove[2]), tr = 8 - parseInt(ev.bestMove[3]);
        document.getElementById("bestMoveVal").textContent = squareToAlg(fc, fr) + " → " + squareToAlg(tc, tr);
        drawArrowSVG(aSvg, ev.mate !== null && ev.mate < 0 ? "am-red" : "am-green", fc, fr, tc, tr);
    } else {
        document.getElementById("bestMoveVal").textContent = "–";
        clearArrowSVG(aSvg);
    }
}

function aRenderNotation() {
    const scroll = document.getElementById("aNotationScroll");
    scroll.innerHTML = "";
    renderMoveList(moveTree, scroll, 0, false);
    const result = pgnTags.Result || "";
    if (result) { const r = document.createElement("span"); r.className = "result-token"; r.textContent = result; scroll.appendChild(r); }
    const active = scroll.querySelector(".move-token.active");
    if (active) active.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

const BADGE_COLORS = {
    brilliant: "#1baca6", best: "#6bab40", great: "#5c8bb0",
    good: "#97b162", excellent: "#a8c060", inaccuracy: "#f0c45a",
    mistake: "#e07c2a", blunder: "#cc3232", missed: "#b07ad0"
};

function renderMoveList(nodes, container, startTurn, isVariation) {
    let turn = startTurn, currentRow = null;
    for (let ni = 0; ni < nodes.length; ni++) {
        const node = nodes[ni];
        const moveIdx = isVariation ? null : turn + 1;
        if (turn % 2 === 0 || currentRow === null) {
            currentRow = document.createElement("div"); currentRow.className = "move-row";
            const num = document.createElement("span"); num.className = "move-num"; num.textContent = (Math.floor(turn / 2) + 1) + ".";
            currentRow.appendChild(num); container.appendChild(currentRow);
        }
        const token = document.createElement("span");
        token.className = "move-token" + (isVariation ? " variation" : "");
        token.textContent = node.san + (node.annotation || "");
        if (!isVariation && classifications[moveIdx]) {
            const cl = classifications[moveIdx];
            const b = document.createElement("span"); b.className = "move-badge-inline"; b.textContent = cl.sym;
            b.style.color = BADGE_COLORS[cl.key] || "";
            token.appendChild(b);
        }
        if (!isVariation) {
            token.dataset.posIdx = moveIdx;
            token.addEventListener("click", () => aGoToPosition(moveIdx));
            if (moveIdx === curPos && freeGrid === null) token.classList.add("active");
        }
        currentRow.appendChild(token);
        if (node.variations && node.variations.length > 0) {
            for (const vn of node.variations) { const vb = document.createElement("div"); vb.className = "var-block"; renderMoveList(vn, vb, turn, true); container.appendChild(vb); }
            currentRow = null;
        }
        if (!isVariation && ni === curPos - 1 && freeMoves.length > 0) {
            const vb = document.createElement("div"); vb.className = "var-block";
            let vt = turn + 1, vRow = null;
            freeMoves.forEach((fm, vi) => {
                if (vt % 2 === 0 || vRow === null) { vRow = document.createElement("div"); vRow.className = "move-row"; const vn = document.createElement("span"); vn.className = "move-num"; vn.textContent = (Math.floor(vt / 2) + 1) + "."; vRow.appendChild(vn); vb.appendChild(vRow); }
                const vTok = document.createElement("span"); vTok.className = "move-token variation"; vTok.textContent = fm.san;
                const vcl = freeClassifications[vi];
                if (vcl) { const b = document.createElement("span"); b.className = "move-badge-inline"; b.textContent = vcl.sym; b.style.color = BADGE_COLORS[vcl.key] || ""; vTok.appendChild(b); }
                vRow.appendChild(vTok); vt++;
            });
            container.appendChild(vb); currentRow = null;
        }
        turn++;
    }
}

// ═══════════════════════════════════════════════════════
// PRE-ANALYSIS
// ═══════════════════════════════════════════════════════
async function aPreAnalyseAll() {
    const total = positions.length;
    const bar = document.getElementById("loadingBar"), sub = document.getElementById("loadingSub");
    evals = new Array(total).fill(null);
    classifications = new Array(total).fill(null);

    for (let i = 0; i < total; i++) {
        bar.style.width = Math.round((i / total) * 100) + "%";
        sub.textContent = i === 0 ? "Startstellung…" : "Zug " + Math.ceil(i / 2) + " wird bewertet…";
        const pos = positions[i];
        const fen = generateFEN(pos.grid, pos.turn, pos.moveStack || []);
        evals[i] = await sfEval(fen, { depth: PREANALYSIS_DEPTH });

        if (i > 0) {
            const prev = evals[i - 1], curr = evals[i];
            const prevPos = positions[i - 1];
            const move = positions[i].moveStack?.[positions[i].moveStack.length - 1];
            if (prev && curr && move) {
                const movedColor = (i - 1) % 2 === 0 ? "white" : "black";
                const delta = movedColor === "white" ? (prev.cp - curr.cp) : (curr.cp - prev.cp);
                let sacrificed = false;
                if (prevPos) sacrificed = isSacrifice(prevPos.grid, move.fromCol, move.fromRow, move.toCol, move.toRow, move.movingPiece, prevPos.moveStack || []);
                const playedUCI = FILES_STR[move.fromCol] + (8 - move.fromRow) + FILES_STR[move.toCol] + (8 - move.toRow);
                const engineBestUCI = prev.bestMove || null;
                let isOnlyGoodMove = false;
                if (delta <= 100 || (engineBestUCI && playedUCI.slice(0, 4) !== engineBestUCI.slice(0, 4))) {
                    const prevFen = generateFEN(prevPos.grid, prevPos.turn, prevPos.moveStack || []);
                    const mpvRes = await sfEvalMultiPV(prevFen, 15, 3);
                    if (mpvRes?.length >= 2) {
                        const bestCp = mpvRes[0] ? (movedColor === "white" ? mpvRes[0].cp : -mpvRes[0].cp) : 0;
                        const secondCp = mpvRes[1] ? (movedColor === "white" ? mpvRes[1].cp : -mpvRes[1].cp) : -9999;
                        if (bestCp - secondCp >= 100 && bestCp >= 50) isOnlyGoodMove = true;
                    } else if (mpvRes?.length === 1) { isOnlyGoodMove = true; }
                }
                classifications[i] = classifyMove(delta, sacrificed, prev, curr, movedColor, playedUCI, engineBestUCI, isOnlyGoodMove);
            }
        }
    }
    bar.style.width = "100%"; sub.textContent = "Fertig!";
    await new Promise(r => setTimeout(r, 400));
}

async function aStartAnalysis(pgn, tags, tree) {
    pgnTags = tags; moveTree = tree;
    positions = buildPositions(tree);
    if (positions.length < 2 && tree.length > 0) { document.getElementById("pgnError").textContent = "Züge konnten nicht verarbeitet werden."; return false; }
    document.getElementById("loadingOverlay").classList.add("show");
    await initStockfish();
    await aPreAnalyseAll();
    document.getElementById("loadingOverlay").classList.remove("show");
    curPos = 0; freeGrid = null; freeMoves = []; freeEvals = []; freeClassifications = []; lastKnownEval = null;
    const info = document.getElementById("aGameInfo"); info.innerHTML = "";
    [["White", tags.White], ["Black", tags.Black], ["Event", tags.Event], ["Date", tags.Date], ["Result", tags.Result]].forEach(([k, v]) => {
        if (!v || v === "?") return;
        const row = document.createElement("div"); row.className = "info-row";
        row.innerHTML = `<span class="info-key">${k}</span><span class="info-val">${v}</span>`;
        info.appendChild(row);
    });
    document.getElementById("aNameBottom").textContent = tags.White || "Weiß";
    document.getElementById("aNameTop").textContent = tags.Black || "Schwarz";
    document.getElementById("aEloBottom").textContent = tags.WhiteElo || "";
    document.getElementById("aEloTop").textContent = tags.BlackElo || "";
    document.getElementById("headerTag").textContent = "Analyse";
    aSquares.forEach(sq => sq.addEventListener("click", aHandleClick));
    aRefreshBoard(); aUpdateNavButtons(); aUpdateEvalUI(evals[0] || null, false);
    return true;
}

// ═══════════════════════════════════════════════════════
// SCREEN NAVIGATION
// ═══════════════════════════════════════════════════════
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// ═══════════════════════════════════════════════════════
// HOME SCREEN LOGIC
// ═══════════════════════════════════════════════════════
document.getElementById("modeBot").addEventListener("click", () => {
    document.getElementById("botSetup").classList.add("visible");
    document.getElementById("pgnSection").classList.remove("visible");
    document.getElementById("headerTag").textContent = "Gegen Bot";
});

document.getElementById("modeFriend").addEventListener("click", async () => {
    document.getElementById("botSetup").classList.remove("visible");
    document.getElementById("pgnSection").classList.remove("visible");
    document.getElementById("headerTag").textContent = "Gegen Freund";
    await initStockfish();
    document.getElementById("gNameBottom").textContent = "Spieler 1";
    document.getElementById("gNameTop").textContent = "Spieler 2";
    document.getElementById("gEloBottom").textContent = "";
    document.getElementById("gEloTop").textContent = "";
    gStartGame("friend", "white", 0);
    showScreen("gameScreen");
});

document.getElementById("modeAnalyse").addEventListener("click", () => {
    document.getElementById("botSetup").classList.remove("visible");
    document.getElementById("pgnSection").classList.add("visible");
    document.getElementById("headerTag").textContent = "PGN Analyse";
});

document.querySelectorAll(".diff-pill").forEach(p => p.addEventListener("click", e => {
    document.querySelectorAll(".diff-pill").forEach(x => x.classList.remove("active"));
    e.target.classList.add("active");
}));
document.querySelectorAll(".color-pill").forEach(p => p.addEventListener("click", e => {
    document.querySelectorAll(".color-pill").forEach(x => x.classList.remove("active"));
    e.target.classList.add("active");
}));

document.getElementById("startBotBtn").addEventListener("click", async () => {
    const elo = +document.querySelector(".diff-pill.active").dataset.elo;
    let color = document.querySelector(".color-pill.active").dataset.color;
    if (color === "random") color = Math.random() < .5 ? "white" : "black";
    gBotElo = elo;
    await initStockfish();
    const botName = "Stockfish (" + elo + ")";
    if (color === "white") { document.getElementById("gNameBottom").textContent = "Du"; document.getElementById("gNameTop").textContent = botName; }
    else { document.getElementById("gNameBottom").textContent = botName; document.getElementById("gNameTop").textContent = "Du"; }
    document.getElementById("gEloBottom").textContent = color === "white" ? "" : elo;
    document.getElementById("gEloTop").textContent = color === "black" ? "" : elo;
    gStartGame("bot", color, elo);
    showScreen("gameScreen");
});

const SAMPLES = {
    immortal: `[Event "The Immortal Game"]\n[White "Anderssen"]\n[Black "Kieseritzky"]\n[Date "1851.06.21"]\n[Result "1-0"]\n\n1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`,
    opera: `[Event "Opera Game"]\n[White "Morphy"]\n[Black "Duke of Brunswick"]\n[Date "1858.??.??"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
    short: `[Event "Quick Game"]\n[White "Scholar"]\n[Black "Victim"]\n[Result "1-0"]\n\n1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0`
};
document.querySelectorAll(".sample-chip").forEach(btn => btn.addEventListener("click", () => {
    document.getElementById("pgnInput").value = SAMPLES[btn.dataset.pgn] || "";
}));

document.getElementById("analyseBtn").addEventListener("click", async () => {
    const pgn = document.getElementById("pgnInput").value.trim();
    if (!pgn) { document.getElementById("pgnError").textContent = "Bitte eine PGN eingeben."; return; }
    let parsed;
    try { parsed = parsePGN(pgn); } catch (e) { document.getElementById("pgnError").textContent = "PGN-Fehler: " + e.message; return; }
    document.getElementById("pgnError").textContent = "";
    const tree = buildMoveTree(parsed.tokens);
    const ok = await aStartAnalysis(pgn, parsed.tags, tree);
    if (ok) showScreen("analysisScreen");
});

document.getElementById("gUndoBtn").addEventListener("click", gUndoMove);

document.getElementById("gHomeBtn").addEventListener("click", () => {
    gSquares.forEach(sq => sq.removeEventListener("click", gHandleClick));
    showScreen("homeScreen"); document.getElementById("headerTag").textContent = "Hauptmenü";
});

document.getElementById("btnBackHome").addEventListener("click", () => {
    document.getElementById("gameOverBanner").classList.remove("show");
    gSquares.forEach(sq => sq.removeEventListener("click", gHandleClick));
    showScreen("homeScreen"); document.getElementById("headerTag").textContent = "Hauptmenü";
});

document.getElementById("btnAnalyseGame").addEventListener("click", async () => {
    document.getElementById("gameOverBanner").classList.remove("show");
    gSquares.forEach(sq => sq.removeEventListener("click", gHandleClick));
    const pgn = gGameToPGN();
    let parsed;
    try { parsed = parsePGN(pgn); } catch (e) { alert("PGN-Fehler"); return; }
    const tree = buildMoveTree(parsed.tokens);
    const ok = await aStartAnalysis(pgn, parsed.tags, tree);
    if (ok) showScreen("analysisScreen");
});

document.getElementById("aBtnFirst").addEventListener("click", () => aGoToPosition(0));

document.getElementById("aBtnPrev").addEventListener("click", () => {
    if (freeMoves.length > 0) {
        freeMoves.pop(); freeEvals.pop(); freeClassifications.pop();
        undoMoveFromStack(freeGrid, freeMoveStack);
        if (freeMoves.length === 0) aExitFreePlay();
        aRefreshBoard(); aUpdateNavButtons();
        const prevEv = freeMoves.length > 0 ? freeEvals[freeMoves.length - 1] : evals[curPos];
        aUpdateEvalUI(prevEv || null, false);
    } else { aExitFreePlay(); aGoToPosition(curPos - 1); }
});

document.getElementById("aBtnNext").addEventListener("click", () => { if (freeGrid === null) aGoToPosition(curPos + 1); });
document.getElementById("aBtnLast").addEventListener("click", () => { if (freeGrid === null) aGoToPosition(positions.length - 1); });

document.getElementById("aBtnHome").addEventListener("click", () => {
    aSquares.forEach(sq => sq.removeEventListener("click", aHandleClick));
    aExitFreePlay();
    showScreen("homeScreen"); document.getElementById("headerTag").textContent = "Hauptmenü";
});

document.getElementById("timeSlider").addEventListener("input", e => {
    liveTimeMs = +e.target.value * 1000;
    document.getElementById("timeVal").textContent = e.target.value + "s";
});

document.addEventListener("keydown", e => {
    const as = document.getElementById("analysisScreen");
    if (!as.classList.contains("active")) return;
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") document.getElementById("aBtnPrev").click();
    if (e.key === "ArrowRight") document.getElementById("aBtnNext").click();
    if (e.key === "Home") document.getElementById("aBtnFirst").click();
    if (e.key === "End") document.getElementById("aBtnLast").click();
    if (e.key === "Escape" && freeGrid !== null) aExitFreePlay();
});

showScreen("homeScreen");
initStockfish().catch(() => { }); // WASM beim Seitenstart vorladen