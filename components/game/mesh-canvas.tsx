"use client";

import { useEffect, useRef } from "react";
import type { SimSnapshot } from "@/lib/types";
import type { WorldNode } from "@/lib/types";

interface Props {
  snapshot: SimSnapshot;
  world: WorldNode[];
  onSelect: (id: string | null) => void;
}

export function MeshCanvas({ snapshot, world, onSelect }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const snapRef = useRef(snapshot);
  const worldRef = useRef(world);
  const hoverRef = useRef<string | null>(null);

  useEffect(() => {
    snapRef.current = snapshot;
    worldRef.current = world;
  }, [snapshot, world]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf = 0;

    const layout = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = (x: number, y: number, w: number, h: number) => ({
      px: 56 + x * (w - 112),
      py: 48 + y * (h - 96),
    });

    const hit = (mx: number, my: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const snap = snapRef.current;
      for (const node of worldRef.current) {
        const p = snap.positions[node.id];
        if (!p) continue;
        const { px, py } = project(p.x, p.y, w, h);
        if (Math.hypot(mx - px, my - py) < 16) return node.id;
      }
      return null;
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const snap = snapRef.current;
      const nodes = worldRef.current;
      frame += 1;

      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 20, w * 0.5, h * 0.5, w * 0.7);
      g.addColorStop(0, "#161616");
      g.addColorStop(1, "#070707");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#d6d6d2";
      ctx.lineWidth = 0.6;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.52, w * 0.42, 18 + i * (h * 0.055), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 7; i++) {
        const x = w * (0.12 + i * 0.13);
        ctx.beginPath();
        ctx.moveTo(x, 24);
        ctx.quadraticCurveTo(w * 0.5, h * 0.55, x + (w * 0.5 - x) * 0.05, h - 20);
        ctx.stroke();
      }
      ctx.restore();

      const pos = (id: string) => {
        const p = snap.positions[id];
        return project(p?.x ?? 0.5, p?.y ?? 0.5, w, h);
      };

      const byId = new Map(nodes.map((n) => [n.id, n]));

      ctx.lineWidth = 1;
      for (const st of snap.nodes) {
        const a = pos(st.id);
        for (const mid of st.mesh) {
          const b = pos(mid);
          ctx.strokeStyle = "rgba(220,220,214,0.08)";
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.stroke();
        }
      }

      for (const flight of snap.flights) {
        const a = pos(flight.from);
        const b = pos(flight.to);
        const u = Math.min(1, flight.t / flight.duration);
        const ease = u * u * (3 - 2 * u);
        const x = a.px + (b.px - a.px) * ease;
        const y = a.py + (b.py - a.py) * ease;
        const mump = flight.protocol === "mump2p";
        ctx.save();
        ctx.strokeStyle = mump ? "rgba(236,236,230,0.35)" : "rgba(196,150,96,0.28)";
        ctx.lineWidth = mump ? 1 : 2;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = flight.polluted ? "#c45c4a" : mump ? "#f3f2ec" : "#c49660";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, mump ? 2.4 : 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const st of snap.nodes) {
        const node = byId.get(st.id);
        if (!node) continue;
        const { px, py } = pos(st.id);
        const selected = snap.selectedId === st.id;
        const hover = hoverRef.current === st.id;
        const isPlayer = st.id === snap.playerId;
        const isPub = st.id === snap.publisherId;
        const r = isPlayer ? 9 : isPub ? 8 : 5.5;

        if (st.decodedMump) {
          ctx.beginPath();
          ctx.arc(px, py, r + 10, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(236,236,230,0.08)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, r + 5, -Math.PI / 2, -Math.PI / 2 + (st.rank / Math.max(1, snap.k)) * Math.PI * 2);
        ctx.strokeStyle = st.polluted ? "#c45c4a" : "#ecece6";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        const grd = ctx.createRadialGradient(px - 2, py - 2, 1, px, py, r + 2);
        if (st.quarantined) {
          grd.addColorStop(0, "#5a2a24");
          grd.addColorStop(1, "#1a0c0a");
        } else if (isPlayer) {
          grd.addColorStop(0, "#ffffff");
          grd.addColorStop(1, "#8d8d88");
        } else if (isPub) {
          grd.addColorStop(0, "#fff7e8");
          grd.addColorStop(1, "#9a7a48");
        } else {
          grd.addColorStop(0, "#d8d8d2");
          grd.addColorStop(1, "#3a3a38");
        }
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        if (selected || hover || isPlayer) {
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, r + 7 + Math.sin(frame / 14) * 0.8, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(245,245,240,0.78)";
        ctx.font = "500 10px Inter, ui-sans-serif, system-ui";
        ctx.textAlign = "center";
        ctx.fillText(node.operator, px, py + r + 14);
        ctx.fillStyle = "rgba(245,245,240,0.38)";
        ctx.font = "500 9px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText(node.region, px, py + r + 26);
      }

      ctx.fillStyle = "rgba(245,245,240,0.35)";
      ctx.font = "500 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText("mump2p · Galois Gossip", 18, h - 18);
      ctx.textAlign = "right";
      ctx.fillText("GossipSub baseline", w - 18, h - 18);

      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      hoverRef.current = hit(e.clientX - rect.left, e.clientY - rect.top);
      canvas.style.cursor = hoverRef.current ? "pointer" : "crosshair";
    };
    const onClick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      onSelect(hit(e.clientX - rect.left, e.clientY - rect.top));
    };

    layout();
    raf = requestAnimationFrame(draw);
    const observer = new ResizeObserver(layout);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onClick);
    window.addEventListener("resize", layout);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onClick);
      window.removeEventListener("resize", layout);
    };
  }, [onSelect]);

  return <canvas ref={ref} className="h-full w-full" />;
}
