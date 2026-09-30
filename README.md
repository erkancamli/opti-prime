# Optimum Relay

Optimum (@get_optimum) için resmi olmayan, premium bir **mump2p operator simülasyonu**. En mantıklı oyun, ürünün kendisidir: bir zinciri “oynamak” değil, verinin nasıl hareket ettiğini oynamak.

Optimum bir L1 değildir. Sidecar, Ethereum client’ın yanında durur; blokları RLNC (Random Linear Network Coding) ile coded shard’lara çevirir; GossipSub her zaman paralel yedek olarak kalır. Bu repo o modeli bir operatör masasına indirger.

## Neden bu oyun

- **mump2p vs GossipSub** aynı slotta koşar — Optimum’un 6–20× hız ve ~90–95% bandwidth iddiası görünür hale gelir.
- **RLNC gerçekten hesaplanır** (GF(2) Gaussian elimination). Decode için k bağımsız kombinasyon yeter.
- **Recode** ara düğümde, tam mesajı beklemeden çalışır.
- **Pollution, Asya RTT, blob surge, Flexnode economy** gerçek dokümantasyondaki tehdit ve fırsatlardır.
- Consensus, validator key, leader selection yok. Propagation katmanı.

## Çalıştırma

```bash
npm install
npm run dev -- --port 43127
```

Tarayıcı: [http://127.0.0.1:43127](http://127.0.0.1:43127)

```bash
npm run build
npm start -- --port 43127
```

## Ekranlar

| Rota | Ne |
| --- | --- |
| `/` | Editorial landing — neden Relay, dört katman, rakamlar |
| `/academy` | RLNC’yi beş adımda encode / kayıp / recode / decode |
| `/play` | Yedi görevlik operator kuyruğu |
| `/play/[id]` | Canlı mesh, sidecar parametreleri, debrief |
| `/manual` | Site + docs + protokol ↔ oyun haritası |

## Kontroller

- Mesh’te düğüm seç
- **Space** recode burst
- **W** IWANT
- **Q** karantina
- ShredFactor, MeshDegree, ForwardThreshold, ShardMultiplier canlı

Kaynaklar: [getoptimum.xyz](https://www.getoptimum.xyz/), [docs](https://docs.getoptimum.xyz/), [X](https://x.com/get_optimum).

## Netlify

Repo GitHub’a bağlandıktan sonra [Netlify](https://app.netlify.com/start) üzerinden GitHub’dan içe aktar. Next.js otomatik tanınır. Derleme komutu `npm run build`, Node 22. Site `*.netlify.app` adresinde herkese açık yayınlanır.
