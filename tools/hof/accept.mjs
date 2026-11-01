// Accepts a score sent through a GitHub issue (see .github/workflows/hall-of-fame.yml).
//
// Reads the issue from the event file GitHub gives the workflow (never from the
// command line: the issue text is untrusted), checks it with the game's own
// rules (web/src/marathon/hof.js), updates hall-of-fame/hall-of-fame.json and
// writes the reply to post on the issue into the file named by REPLY_FILE.
// Usage: GITHUB_EVENT_PATH=event.json REPLY_FILE=reply.md node tools/hof/accept.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseIssueBody, validate, applyEntry, emptyBoard, ranking, REASONS } from '../../web/src/marathon/hof.js';

const BOARD = process.env.BOARD_FILE || 'hall-of-fame/hall-of-fame.json';
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const issue = event.issue;
const login = issue.user.login;
const now = Date.parse(issue.created_at) || Date.now();

const board = existsSync(BOARD) ? JSON.parse(readFileSync(BOARD, 'utf8')) : emptyBoard();
const check = validate(parseIssueBody(issue.body), now);

let reason = check.ok ? null : check.reason;
let next = board;
if (check.ok) {
  const out = applyEntry(board, login, check.entry, now);
  reason = out.reason;
  next = out.board;
  if (next !== board) {
    mkdirSync(dirname(BOARD), { recursive: true });
    writeFileSync(BOARD, `${JSON.stringify(next, null, 2)}\n`);
  }
}

const [en, fr] = REASONS[reason];
const place = ranking(next).findIndex((p) => p.login.toLowerCase() === login.toLowerCase()) + 1;
const lines = [`🇬🇧 ${en}`, `🇫🇷 ${fr}`];
if (check.ok && place > 0) lines.push('', `🏆 #${place} — ${next.players[login.toLowerCase()].best.score} pts`);
writeFileSync(process.env.REPLY_FILE || 'reply.md', `${lines.join('\n')}\n`);
console.log(`${login}: ${reason}`);
