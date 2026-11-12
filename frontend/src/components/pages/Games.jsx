import { useState } from "react";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";

const tiles = ["✦", "◇", "☼", "❋", "◈", "✧", "❀", "◎", "☾", "✺", "♢", "✿"];
const shuffle = () => [...tiles, ...tiles].map((symbol, index) => ({ id: `${index}-${Math.random()}`, symbol })).sort(() => Math.random() - 0.5);
export default function Games() {
  const [cards, setCards] = useState(shuffle);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const pick = (card) => {
    if (open.length === 2 || open.includes(card.id) || matched.includes(card.symbol)) return;
    const next = [...open, card.id]; setOpen(next);
    if (next.length === 2) {
      setMoves((value) => value + 1);
      const first = cards.find((item) => item.id === next[0]);
      if (first?.symbol === card.symbol) { setMatched((value) => [...value, card.symbol]); setOpen([]); }
      else window.setTimeout(() => setOpen([]), 720);
    }
  };
  const reset = () => { setCards(shuffle()); setOpen([]); setMatched([]); setMoves(0); };
  const won = matched.length === tiles.length;
  return <main className="sl-games"><header><span><Sparkles size={14}/> SAVITRI LIVINGS · GAMES</span><h1>A little pause, <em>beautifully played.</em></h1><p>A simple memory match for a moment between the bigger things.</p></header><section className="game-panel" aria-label="Memory match game"><div className="game-heading"><div><small>MEMORY MATCH</small><h2>Find the matching pairs</h2></div><div className="game-stats"><span>Moves <b>{moves}</b></span><button onClick={reset}><RotateCcw size={14}/> Restart</button></div></div><div className="game-grid" role="group" aria-label="Memory cards">{cards.map((card) => { const visible = open.includes(card.id) || matched.includes(card.symbol); return <button key={card.id} type="button" className={`game-card${visible ? " is-open" : ""}`} onClick={() => pick(card)} aria-label={visible ? card.symbol : "Reveal card"} aria-pressed={visible}>{visible ? card.symbol : "✧"}</button>; })}</div><p className="game-message" role="status">{won ? `Lovely work — all pairs found in ${moves} moves.` : `${matched.length} of ${tiles.length} pairs found`}</p></section><a href="/development" className="game-back">Back to Development <ArrowRight size={15}/></a><style>{`.sl-games{min-height:calc(100vh - 150px);padding:clamp(35px,7vw,78px) 16px;background:radial-gradient(ellipse at 50% 0,#fff6e7,#f8f3eb 52%,#f1e9de);color:#493523}.sl-games>header{max-width:780px;margin:0 auto 26px;text-align:center}.sl-games>header>span{display:inline-flex;align-items:center;gap:7px;color:#a2733a;font-size:.66rem;font-weight:800;letter-spacing:.15em}.sl-games h1{margin:15px 0 9px;font:500 clamp(2.3rem,6vw,4rem)/1.02 'Cormorant Garamond',Georgia,serif}.sl-games h1 em{color:#a56d30;font-style:normal}.sl-games>header p{color:#837562;font-size:.92rem}.game-panel{max-width:620px;margin:auto;padding:clamp(18px,4vw,30px);border:1px solid #e4d3b9;border-radius:24px;background:#fffdf9;box-shadow:0 24px 70px #56391813}.game-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:17px}.game-heading small{color:#a2733a;font-size:.6rem;letter-spacing:.14em;font-weight:800}.game-heading h2{margin:4px 0 0;font:500 1.6rem 'Cormorant Garamond',Georgia,serif}.game-stats{display:grid;justify-items:end;gap:9px;color:#837562;font-size:.7rem}.game-stats b{margin-left:4px;color:#493523}.game-stats button{display:flex;align-items:center;gap:5px;padding:6px 9px;border:1px solid #e7d8c5;border-radius:9px;background:#fffaf1;color:#78542c;cursor:pointer}.game-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}.game-card{aspect-ratio:1;border:1px solid #eadcc8;border-radius:13px;background:linear-gradient(145deg,#fffaf1,#f0e3cf);color:#916531;font-size:clamp(1.3rem,4vw,2rem);cursor:pointer;box-shadow:0 4px 12px #51381910;transition:transform .18s,background .18s}.game-card:hover{transform:translateY(-2px)}.game-card.is-open{background:linear-gradient(145deg,#704a28,#9f7243);color:#fff1d3;border-color:#bd9866}.game-message{min-height:20px;margin:15px 0 0;text-align:center;color:#806846;font-size:.77rem}.game-back{display:flex;align-items:center;justify-content:center;gap:7px;margin:20px auto;color:#8e622f;text-decoration:none;font-size:.8rem;font-weight:700}@media(max-width:480px){.game-panel{padding:16px;border-radius:18px}.game-grid{gap:6px}.game-card{border-radius:9px}}@media(prefers-reduced-motion:reduce){.game-card{transition:none}}`}</style></main>;
}
