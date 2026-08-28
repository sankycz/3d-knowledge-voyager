# Počítadlo vlakových souprav

Aplikace, která sleduje živý přenos vlakové kamery (Praha hlavní nádraží) a
počítá, kolik vlakových souprav na jednotlivých kolejích odjelo a kolik
přijelo.

- **Modrá tečka** = odjezd, **červená tečka** = příjezd.
- Kolej je čára nakreslená přímo přes skutečnou trať (i šikmo) — zároveň
  slouží jako počítací brána. Žluté koncové body jde tažením myší doladit.
- Kamera se dívá na nádraží shora: vlak mířící dolů (pryč od budovy) = odjezd,
  mířící nahoru (k nástupištím) = příjezd. Lze otočit ručně pro jednotlivou
  kolej.
- Každá kolej má vlastní počítadlo odjezdů/příjezdů a historii teček.

Aplikace má dva režimy čtení obrazu — přepínač nahoře na stránce:

## Režim „Server (automaticky)“

Vlastní [Node.js server](server/README.md) stahuje YouTube přenos napřímo
(`yt-dlp` + `ffmpeg`), rozpoznává v něm vlaky a posílá výsledky do prohlížeče
přes WebSocket. Nic se neklikká, běží to i bez otevřené stránky. Vyžaduje
vlastní hosting (viz [server/README.md](server/README.md) — tam je i
vysvětlení, proč to nejde přímo z prohlížeče a jaká má tohle řešení
omezení/rizika).

Do pole v UI zadejte adresu serveru, např. `ws://localhost:8787` lokálně,
nebo `wss://...` pro nasazenou verzi (HTTPS stránka nesmí z bezpečnostních
důvodů použít nešifrované `ws://`).

## Režim „Sdílení obrazovky“

Funguje okamžitě, bez žádné vlastní infrastruktury:

1. Na stránce je vestavěný živý přenos z YouTube.
2. Tlačítkem **„Spustit sdílení obrazovky“** se otevře systémový dialog
   sdílení obsahu prohlížeče (`getDisplayMedia`) — vyberte v něm **tuto
   kartu**, aby šlo video přímo analyzovat (přímý přístup k pixelům
   YouTube přehrávače z prohlížeče není možný, proto se používá sdílení
   obrazovky).
3. V prohlížeči se načte model [`coco-ssd`](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)
   (přes TensorFlow.js, z CDN), který v obraze rozpoznává třídu `train`.
4. Detekce běží jen dokud je karta otevřená a sdílená; data se ukládají jen
   lokálně v tomto prohlížeči (`localStorage`).

V obou režimech tlačítko **„Rozpoznat koleje z kamery“** spustí ~20s
kalibraci: podle toho, kde a jak se v obraze vlaky pohybují, aplikace
navrhne (i šikmé) koleje. Pokud se ve vysílání objeví reklama nebo video na
pár sekund vypadne, rozpoznávání jednoduše nic nenajde a samo pokračuje,
jakmile se vrátí živý záběr.

## Vývoj

```bash
npm install
npm run dev
```

Otevřete [http://localhost:3000](http://localhost:3000).

Režim sdílení obrazovky vyžaduje prohlížeč s podporou `getDisplayMedia`
(desktopové Chrome, Edge nebo Firefox). Pro režim se serverem viz
[server/README.md](server/README.md).
