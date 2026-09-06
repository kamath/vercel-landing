// Content of the two notebook pages, as note blocks.

export interface NoteItem {
  text: string;
  strike?: boolean;
  underline?: boolean;
  indent?: number; // in em
  gap?: number; // extra space after, in em
  size?: number; // relative font size
}

export interface Note {
  id: string;
  items: NoteItem[];
  wide?: boolean;
  /** Draw a hand-drawn box around the whole block. */
  boxed?: boolean;
  /** Draw a curly brace to the left of items [from, to]. */
  brace?: [number, number];
  /** Standalone drawing instead of text. */
  figure?: 'client-server' | 'flight' | 'mcp-axes';
  /** Preferred max text width in em (block is narrower than its column if smaller). */
  em?: number;
}

const L = (text: string, extra: Partial<NoteItem> = {}): NoteItem => ({ text, ...extra });
const X = (text: string, extra: Partial<NoteItem> = {}): NoteItem => ({ text, strike: true, ...extra });
const SUB = (text: string, extra: Partial<NoteItem> = {}): NoteItem => ({ text, indent: 1.2, ...extra });

export const notes: Note[] = [
  { id: 'date', items: [L('04/27/2025', { size: 1.05 })], em: 8 },
  {
    id: 'flight',
    items: [L('4:14 left on this flight back to SF from NYC (EWR specifically).')],
    em: 17,
  },
  { id: 'flight-fig', items: [], figure: 'flight', em: 12 },
  {
    id: 'todo1',
    items: [X('Send Smithery Chat email'), X('Vegas flight'), X('Coachella flights'), X('Browserbase'), L('Send cal invites')],
    em: 13,
  },
  {
    id: 'board',
    items: [L('1) generateBoard()'), L('2) generateMove()'), L('3) makeMove()'), L('4) gradeMove()')],
    brace: [0, 3],
    em: 11,
  },
  {
    id: 'menus',
    items: [
      L('Make menus in minutes:', { gap: 0.2 }),
      SUB('1) Configure agent (ACP)'),
      SUB('2) Configure runtime (local, Vercel, Daytona, E2B)'),
      SUB('3) Configure browser (Browserbase, Kernel)'),
      SUB('4) Configure search (Exa, Linkup, Brightdata)'),
      SUB('5) Configure skills'),
      SUB('6) Configure tools'),
      SUB('7) Configure triggers/cron'),
    ],
    wide: true,
    em: 24,
  },
  { id: 'mcp-claude', items: [L('MCP as any only works on Claude', { underline: true })], em: 14 },
  {
    id: 'mcp-horizontal',
    items: [
      L('MCP = horizontal', { underline: true, gap: 0.2 }),
      SUB('→ is the future in just vertical?'),
      SUB('→ will vertical use MCP?'),
      SUB('→ will vertical expose MCP?'),
    ],
    em: 16,
  },
  { id: 'axes-fig', items: [], figure: 'mcp-axes', em: 12 },
  {
    id: 'olly',
    items: [L('olly → free if we can train'), SUB('→ charge per n+ if zero retention'), SUB('→ charge per tool call')],
    em: 16,
  },
  { id: 'ask-ai', items: [L('Every app has "Ask AI"'), SUB('→ nobody likes this')], em: 13 },
  { id: 'client-server', items: [], figure: 'client-server', em: 13 },
  {
    id: 'reviews',
    items: [X('Charter review'), L('- Notion Blog review'), X('AgentMail'), L('- Agent.pw')],
    em: 11,
  },
  {
    id: 'connection',
    items: [
      L('1) create connection always creates new'),
      L('2) callTool needs fallback to AI in case of failure'),
      L('3) what API key should we use?'),
      L('4) audit log', { underline: true }),
    ],
    wide: true,
    em: 22,
  },
  {
    id: 'problems',
    items: [
      L('Problems w/ MCP:', { gap: 0.15 }),
      SUB('- context aggregation'),
      SUB('- linked context "do this using Stagehand and AI SDK"'),
      SUB('- tool explosion'),
    ],
    em: 17,
  },
  { id: 'agent-yaml', items: [L('agent.yaml as a way to connect to an agent itself through agent.pw?')], em: 18 },
  {
    id: 'solution',
    items: [
      L('Solution: A2A?', { gap: 0.1 }),
      SUB('- offload entire task to agent'),
      SUB('- keeps track of convo history', { gap: 0.6 }),
      L('Solution 2: SDK aggregator'),
    ],
    em: 15,
  },
  { id: 'abbrev', items: [L('"great abbreviations" - Huxley')], boxed: true, em: 14 },
  { id: 'taxes', items: [L('1) TAXES'), L('2) Investor Update'), L('3)')], em: 9 },
  { id: 'acpx', items: [L('acpx MCP - global'), SUB('- permissions?')], em: 11 },
  {
    id: 'worktree',
    items: [
      X('filesystem open in worktree'),
      X('→ when starting agent, allow start from worktree or cwd', { indent: 1.2 }),
      L('- permission sets'),
      L('- automations'),
    ],
    em: 18,
  },
  {
    id: 'june',
    items: [
      L('6/15/2025:', { gap: 0.1 }),
      X('Car registration', { indent: 1.2 }),
      X('KL cancellation', { indent: 1.2 }),
      X('ChatGPT UI', { indent: 1.2 }),
      X('Change of Address Jasper', { indent: 1.2 }),
      X('Book flight back to SF for 7/17', { indent: 1.2 }),
    ],
    em: 14,
  },
  {
    id: 'situation',
    items: [
      L('1) generateSituation()'),
      L('2) makeMove()'),
      L('3) gradeMove()', { gap: 0.6 }),
      L('- comments'),
      L('- auth'),
      L('- git version'),
      L('- git version comments'),
    ],
    em: 12,
  },
  {
    id: 'template',
    items: [
      L('- Every message gets sent as a queued input to an agent template', { underline: true }),
      L('- agent template = ACP-compatible agent + directory/optionally new worktree'),
      L('- skills pre-loaded so can run before agent init'),
      L('- MCP powered by Smithery'),
    ],
    wide: true,
    em: 24,
  },
];
