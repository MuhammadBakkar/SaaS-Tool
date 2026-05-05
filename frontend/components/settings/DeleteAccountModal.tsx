let source, pos, end,
  openTokenDepth,
  lastTokenPos,
  openTokenPosStack,
  openClassPosStack,
  curDynamicImport,
  templateStackDepth,
  facade,
  lastSlashWasDivision,
  nextBraceIsClass,
  templateDepth,
  templateStack,
  imports,
  exports,
  name;

function addImport (ss, s, e, d) {
  const impt = { ss, se: d === -2 ? e : d === -1 ? e + 1 : 0, s, e, d, a: -1, n: undefined };
  imports.push(impt);
  return impt;
}

function addExport (s, e, ls, le) {
  exports.push({
    s,
    e,
    ls,
    le,
    n: s[0] === '"' ? readString(s, '"') : s[0] === "'" ? readString(s, "'") : source.slice(s, e),
    ln: ls[0] === '"' ? readString(ls, '"') : ls[0] === "'" ? readString(ls, "'") : source.slice(ls, le)
  });
}

function readName (impt) {
  let { d, s } = impt;
  if (d !== -1)
    s++;
  impt.n = readString(s, source.charCodeAt(s - 1));
}

// Note: parsing is based on the _assumption_ that the source is already valid
export function parse (_source, _name) {
  openTokenDepth = 0;
  curDynamicImport = null;
  templateDepth = -1;
  lastTokenPos = -1;
  lastSlashWasDivision = false;
  templateStack = Array(1024);
  templateStackDepth = 0;
  openTokenPosStack = Array(1024);
  openClassPosStack = Array(1024);
  nextBraceIsClass = false;
  facade = true;
  name = _name || '@';

  imports = [];
  exports = [];

  source = _source;
  pos = -1;
  end = source.length - 1;
  let ch = 0;

  // start with a pure "module-only" parser
  m: while (pos++ < end) {
    ch = source.charCodeAt(pos);

    if (ch === 32 || ch < 14 && ch > 8)
      continue;

    switch (ch) {
      case 101/*e*/:
        if (openTokenDepth === 0 && keywordStart(pos) && source.startsWith('xport', pos + 1)) {
          tryParseExportStatement();
          // export might have been a non-pure declaration
          if (!facade) {
            lastTokenPos = pos;
            break m;
          }
        }
        break;
      case 105/*i*/:
        if (keywordStart(pos) && source.startsWith('mport', pos + 1))
          tryParseImportStatement();
        break;
      case 59/*;*/:
        break;
      case 47/*/*/: {
        const next_ch = source.charCodeAt(pos + 1);
        if (next_ch === 47/*/*/) {
          lineComment();
          // dont update lastToken
          continue;
        }
        else if (next_ch === 42/***/) {
          blockComment(true);
          // dont update lastToken
          continue;
        }
        // fallthrough
      }
      default:
        // as soon as we hit a non-module token, we go to main parser
        facade = false;
        pos--;
        break m;
    }
    lastTokenPos = pos;
  }

  while (pos++ < end) {
    ch = source.charCodeAt(pos);

    if (ch === 32 || ch < 14 && ch > 8)
      continue;

    switch (ch) {
      case 101/*e*/:
        if (openTokenDepth === 0 && keywordStart(pos) && source.startsWith('xport', pos + 1))
          tryPar