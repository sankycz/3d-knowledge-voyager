# Počítadlo vlakových souprav

Next.js aplikace, která sleduje živý přenos vlakové kamery a počítá, kolik
vlakových souprav na jednotlivých kolejích odjelo a kolik přijelo.

- **Modrá tečka** = odjezd, **červená tečka** = příjezd.
- Každá kolej má vlastní počítadlo odjezdů/příjezdů a historii teček.
- Data se ukládají jen lokálně v prohlížeči (`localStorage`).

## Jak to funguje

1. Na stránce je vestavěný živý přenos z YouTube.
2. Tlačítkem **„Spustit sdílení obrazovky“** se otevře systémový dialog
   sdílení obsahu prohlížeče (`getDisplayMedia`) — vyberte v něm **tuto
   kartu**, aby šlo video přímo analyzovat (přímý přístup k pixelům
   YouTube přehrávače z prohlížeče není možný, proto se používá sdílení
   obrazovky).
3. V prohlížeči se načte model [`coco-ssd`](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)
   (přes TensorFlow.js, z CDN), který v obraze rozpoznává třídu `train`.
4. Tlačítko **„Rozpoznat koleje z kamery“** spustí ~20s kalibraci: podle
   toho, kde se v obraze vlaky objevují, aplikace navrhne vodorovná pásma
   pro jednotlivé koleje. Koleje lze kdykoliv ručně přidat, přejmenovat,
   odebrat nebo otočit směr počítání.
5. Když sledovaný vlak přejede pomyslnou bránu uprostřed koleje, přičte se
   odjezd nebo příjezd a na plátně i v historii koleje se objeví barevná
   tečka.

Pokud se ve vysílání objeví reklama nebo video na pár sekund vypadne,
rozpoznávání jednoduše nic nenajde a samo pokračuje, jakmile se vrátí živý
záběr — nic se ručně restartovat nemusí.

## Vývoj

```bash
npm install
npm run dev
```

Otevřete [http://localhost:3000](http://localhost:3000).

Detekce vyžaduje prohlížeč s podporou `getDisplayMedia` (desktopové Chrome,
Edge nebo Firefox) a probíhá celá na straně klienta.
