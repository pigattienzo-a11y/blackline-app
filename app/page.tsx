"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, RotateCcw, Play, Pause, CheckCircle2, Timer, Search } from "lucide-react";

// BLACKLINE – Mini Web App (mobile-first)
// - Checklist par phases + répartition A/B
// - Timers (global + par phase)
// - Notes
// - Sauvegarde automatique (localStorage)
// - Export JSON/CSV

const LS_KEY = "blackline_signature_v2_state";

function msToHMS(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const PROTOCOL = [
  {
    id: "p0",
    title: "PHASE 0 — Installation & Diagnostic",
    timeMin: 10,
    overlap: "Les deux restent sur la même zone. Valider avec le client les zones critiques + photos AVANT.",
    tasks: {
      A: [
        "Déployer rallonge noire + sécuriser passage câble",
        "Installer table tapis + préparer bacs intérieur/extérieur",
        "Préparer microfibres (tri intérieur / extérieur / vitres)",
      ],
      B: [
        "Installer HP + vérifier raccord eau / pression",
        "Sortir seaux + produits extérieur (jantes, mousse, shampoing)",
        "Brief client + repérer zones à traiter",
      ],
    },
    checklist: [
      "Véhicule positionné / freins / clés récupérées",
      "Rallonge déroulée proprement (pas de boucles au sol)",
      "HP installé + test rapide OK",
      "Table tapis prête + tapis repérés (AV/AR)",
      "Produits/outil extérieurs accessibles (ordre d’usage)",
      "Produits/outil intérieurs accessibles (ordre d’usage)",
      "Photos AVANT (extérieur + intérieur zones critiques)",
    ],
  },
  {
    id: "p1",
    title: "PHASE 1 — Extérieur à 2",
    timeMin: 60,
    overlap:
      "Pendant pose mousse : sortir/installer tapis sur table (sans démarrer l’intérieur). Pendant séchage : lancer la transition.",
    tasks: {
      A: ["Jantes côté gauche (2 roues) + pneus", "Lavage côté gauche", "Séchage côté gauche + joints visibles"],
      B: ["Jantes côté droit (2 roues) + pneus", "Lavage côté droit", "Séchage côté droit + joints visibles"],
    },
    checklist: [
      "Jantes : faces + intérieur branches (x4)",
      "Passages de roues rincés",
      "Pré-rinçage complet",
      "Mousse appliquée uniformément (temps de pose respecté)",
      "Lavage méthode 2 seaux (pas de retour gant jantes)",
      "Rinçage complet (aucun résidu)",
      "Séchage sans traces (microfibres propres)",
      "Joints/contours portes essuyés",
    ],
  },
  {
    id: "p2",
    title: "PHASE 2 — Transition & Tapis",
    timeMin: 20,
    overlap: "Démarrer dès que l’extérieur est rincé et en cours de séchage. Objectif : zéro temps mort.",
    tasks: {
      A: ["Sortir tapis + aspiration sur table", "Détachage tapis (si besoin)", "Extraction tapis (si prévue)"],
      B: ["Coffre : aspiration + micro-détails", "Joints de portes (détails)", "Check eau résiduelle (rétros, logos)"],
    },
    checklist: [
      "Tapis installés sur table (zone propre)",
      "Aspiration tapis OK",
      "Extraction tapis (si prévue) + temps noté",
      "Coffre aspiré et nettoyé",
      "Joints/contours portes détaillés",
      "Carrosserie : check eau résiduelle (rétros, grilles, logos)",
    ],
  },
  {
    id: "p3",
    title: "PHASE 3 — Intérieur à 2 (Avant / Arrière)",
    timeMin: 80,
    overlap:
      "Pendant extraction banquette AR, l’avant continue (détachage / détails console). Ne pas faire 2 extractions simultanées.",
    tasks: {
      A: [
        "ZONE AVANT : aspiration complète (sol, sièges, rails)",
        "Détachage sièges avant + console",
        "Plastiques AV (haut → bas) + vitres AV",
      ],
      B: [
        "ZONE ARRIÈRE : aspiration complète (sol, banquette, coffre si besoin)",
        "Extraction banquette AR (si prévue) + détachage zones critiques",
        "Plastiques AR (haut → bas) + vitres AR",
      ],
    },
    checklist: [
      "Aspiration AV : rails + dessous sièges (check)",
      "Aspiration AR : sol + banquette + recoins (check)",
      "Extraction banquette AR effectuée (si prévue)",
      "Détachage zones critiques traité (sièges / banquette)",
      "Plastiques AV : tableau de bord/volant/console (sans traces)",
      "Plastiques AR : portes/contours/console AR (sans traces)",
      "Vitres AV : contrôle reflets OK",
      "Vitres AR : contrôle reflets OK",
      "Remise tapis alignés (secs / propres)",
    ],
  },
  {
    id: "p4",
    title: "PHASE 4 — Finitions Premium & Contrôle Croisé",
    timeMin: 20,
    overlap: "Changement de zone (A contrôle AR, B contrôle AV). Contrôle croisé obligatoire avant livraison.",
    tasks: {
      A: [
        "Contrôle zone AR (vitres, plastiques, banquette)",
        "Micro-détails extérieurs : logos / grilles",
        "Retouches finales",
      ],
      B: ["Contrôle zone AV (volant, console, vitres)", "Dressing pneus + plastiques extérieurs", "Retouches finales"],
    },
    checklist: [
      "Dressing pneus uniforme (pas de surbrillance)",
      "Plastiques extérieurs homogènes (pas de coulures)",
      "Logos / grilles / joints contrôlés",
      "Aucune trace d’eau résiduelle visible",
      "Contrôle croisé réalisé (A↔B)",
      "Photos APRÈS prêtes (angles + détails)",
    ],
  },
  {
    id: "p5",
    title: "PHASE 5 — Livraison Client",
    timeMin: 10,
    overlap: "Présentation guidée : montrer 3 zones transformées. Demande avis au pic de satisfaction.",
    tasks: {
      A: ["Tour extérieur + mise en valeur", "Demande avis Google (phrase standard)"],
      B: ["Tour intérieur + mise en valeur", "Encaissement + confirmation fin de prestation"],
    },
    checklist: [
      "Photos APRÈS réalisées (extérieur + intérieur + détail)",
      "Tour véhicule guidé (3 points forts)",
      "Paiement encaissé",
      "Avis demandé (lien envoyé si nécessaire)",
      "Matériel rangé + zone client propre",
      "Débrief rapide noté (amélioration)",
    ],
  },
] as const;

type ProtocolPhase = (typeof PROTOCOL)[number];
type PhaseId = ProtocolPhase["id"];

type TimerState = {
  running: boolean;
  startedAt: number | null;
  elapsedMs: number;
};

type AppState = {
  meta: {
    client: string;
    vehicule: string;
    adresse: string;
    date: string;
    heure: string;
  };
  globalTimer: TimerState;
  phaseTimers: Record<PhaseId, TimerState>;
  done: Record<PhaseId, Record<number, boolean>>;
  notes: Record<PhaseId, Record<number, string>>;
  phaseNotes: Record<PhaseId, string>;
  debrief: { tempsTotal: string; exterieur: string; interieur: string; extraction: string; tropLong: string; improvement: string };
  ui: { compact: boolean; showTasks: boolean; search: string };
};

function buildInitialState(): AppState {
  const phaseTimers = Object.fromEntries(
    PROTOCOL.map((p) => [p.id, { running: false, startedAt: null, elapsedMs: 0 }])
  ) as Record<PhaseId, TimerState>;

  const done = Object.fromEntries(
    PROTOCOL.map((p) => [p.id, Object.fromEntries(p.checklist.map((_, i) => [i, false]))])
  ) as Record<PhaseId, Record<number, boolean>>;

  const notes = Object.fromEntries(
    PROTOCOL.map((p) => [p.id, Object.fromEntries(p.checklist.map((_, i) => [i, ""]))])
  ) as Record<PhaseId, Record<number, string>>;

  const phaseNotes = Object.fromEntries(PROTOCOL.map((p) => [p.id, ""])) as Record<PhaseId, string>;

  return {
    meta: { client: "", vehicule: "", adresse: "", date: todayISO(), heure: "" },
    globalTimer: { running: false, startedAt: null, elapsedMs: 0 },
    phaseTimers,
    done,
    notes,
    phaseNotes,
    debrief: { tempsTotal: "", exterieur: "", interieur: "", extraction: "", tropLong: "", improvement: "" },
    ui: { compact: true, showTasks: true, search: "" },
  };
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(state: AppState) {
  const lines: string[] = [];
  lines.push(["phase", "checkpoint", "done", "note"].join(","));
  PROTOCOL.forEach((p) => {
    p.checklist.forEach((c, i) => {
      const done = state.done[p.id][i] ? "1" : "0";
      const note = (state.notes[p.id][i] || "").replaceAll('"', '""');
      lines.push([`"${p.title}"`, `"${c}"`, done, `"${note}"`].join(","));
    });
  });
  return lines.join("\n");
}

type FilteredItem = { c: string; i: number };
type FilteredPhase = ProtocolPhase & { _filtered?: FilteredItem[] };

export default function BlacklineSignatureApp() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return buildInitialState();
      const parsed = JSON.parse(raw) as Partial<AppState>;

      const fresh = buildInitialState();
      return {
        ...fresh,
        ...parsed,
        meta: { ...fresh.meta, ...(parsed.meta || {}) },
        globalTimer: { ...fresh.globalTimer, ...(parsed.globalTimer || {}) },
        phaseTimers: { ...fresh.phaseTimers, ...(parsed.phaseTimers || {}) },
        done: { ...fresh.done, ...(parsed.done || {}) },
        notes: { ...fresh.notes, ...(parsed.notes || {}) },
        phaseNotes: { ...fresh.phaseNotes, ...(parsed.phaseNotes || {}) },
        debrief: { ...fresh.debrief, ...(parsed.debrief || {}) },
        ui: { ...fresh.ui, ...(parsed.ui || {}) },
      };
    } catch {
      return buildInitialState();
    }
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        let changed = false;
        const now = Date.now();

        const next: AppState = { ...prev };

        if (prev.globalTimer.running && prev.globalTimer.startedAt) {
          const elapsed = prev.globalTimer.elapsedMs + (now - prev.globalTimer.startedAt);
          next.globalTimer = { running: true, startedAt: now, elapsedMs: elapsed };
          changed = true;
        }

        const nextPhaseTimers: AppState["phaseTimers"] = { ...prev.phaseTimers };
        for (const [pid, t] of Object.entries(prev.phaseTimers) as [PhaseId, TimerState][]) {
          if (t.running && t.startedAt) {
            const elapsed = t.elapsedMs + (now - t.startedAt);
            nextPhaseTimers[pid] = { running: true, startedAt: now, elapsedMs: elapsed };
            changed = true;
          }
        }
        if (changed) next.phaseTimers = nextPhaseTimers;

        return changed ? next : prev;
      });
    }, 1000);

    tickRef.current = interval;
    return () => clearInterval(interval);
  }, []);

  const totals = useMemo(() => {
    let totalChecks = 0;
    let doneChecks = 0;
    for (const p of PROTOCOL) {
      totalChecks += p.checklist.length;
      doneChecks += Object.values(state.done[p.id] || {}).filter(Boolean).length;
    }
    const pct = totalChecks ? Math.round((doneChecks / totalChecks) * 100) : 0;
    return { totalChecks, doneChecks, pct };
  }, [state.done]);

  const filteredProtocol = useMemo<FilteredPhase[]>(() => {
    const q = (state.ui.search || "").trim().toLowerCase();
    if (!q) return PROTOCOL as unknown as FilteredPhase[];

    const mapped = (PROTOCOL as unknown as FilteredPhase[]).map((p) => {
      const items = p.checklist
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.toLowerCase().includes(q));
      return { ...p, _filtered: items };
    });

    return mapped.filter((p) => (p._filtered?.length || 0) > 0 || p.title.toLowerCase().includes(q));
  }, [state.ui.search]);

  const toggleGlobal = () => {
    setState((prev) => {
      const now = Date.now();
      if (prev.globalTimer.running) {
        return { ...prev, globalTimer: { running: false, startedAt: null, elapsedMs: prev.globalTimer.elapsedMs } };
      }
      return { ...prev, globalTimer: { running: true, startedAt: now, elapsedMs: prev.globalTimer.elapsedMs } };
    });
  };

  const resetAll = () => {
    if (!confirm("Réinitialiser toute la prestation ? (toutes les cases + timers + notes)")) return;
    setState(buildInitialState());
  };

  const exportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      meta: state.meta,
      globalElapsedMs: state.globalTimer.elapsedMs,
      phaseElapsedMs: Object.fromEntries(
        (Object.entries(state.phaseTimers) as [PhaseId, TimerState][]).map(([k, v]) => [k, v.elapsedMs])
      ) as Record<string, number>,
      done: state.done,
      notes: state.notes,
      phaseNotes: state.phaseNotes,
      debrief: state.debrief,
    };

    downloadText(`blackline_signature_${state.meta.date || todayISO()}.json`, JSON.stringify(payload, null, 2));
  };

  const exportCSV = () => {
    downloadText(`blackline_signature_${state.meta.date || todayISO()}.csv`, toCSV(state));
  };

  const togglePhaseTimer = (pid: PhaseId) => {
    setState((prev) => {
      const now = Date.now();
      const current = prev.phaseTimers[pid];
      const nextPhaseTimers = { ...prev.phaseTimers };

      if (current.running) {
        nextPhaseTimers[pid] = { running: false, startedAt: null, elapsedMs: current.elapsedMs };
      } else {
        nextPhaseTimers[pid] = { running: true, startedAt: now, elapsedMs: current.elapsedMs };
      }
      return { ...prev, phaseTimers: nextPhaseTimers };
    });
  };

  const resetPhaseTimer = (pid: PhaseId) => {
    setState((prev) => ({
      ...prev,
      phaseTimers: { ...prev.phaseTimers, [pid]: { running: false, startedAt: null, elapsedMs: 0 } },
    }));
  };

  const toggleCheck = (pid: PhaseId, idx: number) => {
    setState((prev) => ({
      ...prev,
      done: { ...prev.done, [pid]: { ...prev.done[pid], [idx]: !prev.done[pid][idx] } },
    }));
  };

  const setNote = (pid: PhaseId, idx: number, val: string) => {
    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, [pid]: { ...prev.notes[pid], [idx]: val } },
    }));
  };

  const phaseProgress = (pid: PhaseId) => {
    const p = PROTOCOL.find((x) => x.id === pid);
    if (!p) return 0;
    const total = p.checklist.length;
    const done = Object.values(state.done[pid] || {}).filter(Boolean).length;
    return total ? Math.round((done / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl sm:text-2xl">BLACKLINE — Protocole Signature</CardTitle>
                <div className="text-sm text-neutral-600 mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-xl">
                    V2 Terrain
                  </Badge>
                  <span className="inline-flex items-center gap-1">
                    <Timer className="w-4 h-4" /> {msToHMS(state.globalTimer.elapsedMs)}
                  </span>
                  <span className="text-neutral-400">•</span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {totals.doneChecks}/{totals.totalChecks} ({totals.pct}%)
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={toggleGlobal} variant={state.globalTimer.running ? "secondary" : "default"} className="rounded-2xl">
                  {state.globalTimer.running ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button onClick={resetAll} variant="outline" className="rounded-2xl">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={state.meta.client}
                onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, client: e.target.value } }))}
                placeholder="Client"
                className="rounded-2xl"
              />
              <Input
                value={state.meta.vehicule}
                onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, vehicule: e.target.value } }))}
                placeholder="Véhicule"
                className="rounded-2xl"
              />
              <Input
                value={state.meta.adresse}
                onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, adresse: e.target.value } }))}
                placeholder="Adresse"
                className="rounded-2xl"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={state.meta.date}
                  onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, date: e.target.value } }))}
                  className="rounded-2xl"
                />
                <Input
                  value={state.meta.heure}
                  onChange={(e) => setState((p) => ({ ...p, meta: { ...p.meta, heure: e.target.value } }))}
                  placeholder="Heure"
                  className="rounded-2xl"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={state.ui.compact} onCheckedChange={(v) => setState((p) => ({ ...p, ui: { ...p.ui, compact: v } }))} />
                  <span className="text-sm text-neutral-700">Mode compact</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={state.ui.showTasks} onCheckedChange={(v) => setState((p) => ({ ...p, ui: { ...p.ui, showTasks: v } }))} />
                  <span className="text-sm text-neutral-700">Afficher A/B</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" className="rounded-2xl" onClick={exportJSON}>
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={state.ui.search}
                  onChange={(e) => setState((p) => ({ ...p, ui: { ...p.ui, search: e.target.value } }))}
                  placeholder="Rechercher un checkpoint…"
                  className="pl-9 rounded-2xl"
                />
              </div>
              <Badge variant="secondary" className="rounded-xl">
                Autosave
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredProtocol.map((p) => {
            const t = state.phaseTimers[p.id];
            const prog = phaseProgress(p.id);
            const overTarget = Math.round(t.elapsedMs / 60000) > p.timeMin;
            const filteredItems = p._filtered || null;

            return (
              <Card key={p.id} className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base sm:text-lg">{p.title}</CardTitle>
                        <Badge className="rounded-xl" variant={prog === 100 ? "default" : "secondary"}>
                          {prog}%
                        </Badge>
                        <Badge className="rounded-xl" variant={overTarget ? "destructive" : "secondary"}>
                          Cible: {p.timeMin} min
                        </Badge>
                      </div>
                      <div className="text-sm text-neutral-600 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <Timer className="w-4 h-4" /> {msToHMS(t.elapsedMs)}
                        </span>
                        <span className="text-neutral-300">|</span>
                        <span className="text-neutral-600">Transition: {p.overlap}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => togglePhaseTimer(p.id)} variant={t.running ? "secondary" : "default"} className="rounded-2xl">
                        {t.running ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </>
                        )}
                      </Button>
                      <Button onClick={() => resetPhaseTimer(p.id)} variant="outline" className="rounded-2xl">
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {state.ui.showTasks && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">Personne A</div>
                          <Badge variant="secondary" className="rounded-xl">
                            Zone
                          </Badge>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                          {p.tasks.A.map((x, idx) => (
                            <li key={idx} className="leading-snug">
                              • {x}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-2xl border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">Personne B</div>
                          <Badge variant="secondary" className="rounded-xl">
                            Zone
                          </Badge>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                          {p.tasks.B.map((x, idx) => (
                            <li key={idx} className="leading-snug">
                              • {x}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border bg-white">
                    <div className="p-3">
                      <div className="font-semibold">Checklist</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Cochez au fur et à mesure. Ajoutez une note si besoin (ex: &quot;tache siège&quot;, &quot;temps +5min&quot;).
                      </div>
                    </div>
                    <Separator />

                    <div className={state.ui.compact ? "p-2" : "p-3"}>
                      <div className="space-y-2">
                        {(filteredItems ? filteredItems : p.checklist.map((c, i) => ({ c, i }))).map(({ c, i }) => (
                          <div key={i} className="rounded-2xl border p-3 bg-neutral-50">
                            <div className="flex items-start gap-3">
                              <Checkbox checked={!!state.done[p.id][i]} onCheckedChange={() => toggleCheck(p.id, i)} />
                              <div className="flex-1">
                                <div className="text-sm font-medium leading-snug">{c}</div>
                                <div className="mt-2">
                                  <Textarea
                                    value={state.notes[p.id][i] || ""}
                                    onChange={(e) => setNote(p.id, i, e.target.value)}
                                    placeholder="Note (optionnel)…"
                                    className="rounded-2xl min-h-[64px]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3">
                        <Textarea
                          value={state.phaseNotes[p.id] || ""}
                          onChange={(e) =>
                            setState((prev) => ({ ...prev, phaseNotes: { ...prev.phaseNotes, [p.id]: e.target.value } }))
                          }
                          placeholder="Note de phase (ex: ce qui a ralenti / amélioration)…"
                          className="rounded-2xl min-h-[72px]"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Débrief (fin de prestation)</CardTitle>
            <div className="text-sm text-neutral-600">Objectif: améliorer à chaque prestation, sans se marcher dessus.</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={state.debrief.tempsTotal}
                onChange={(e) => setState((p) => ({ ...p, debrief: { ...p.debrief, tempsTotal: e.target.value } }))}
                placeholder="Temps total (ex: 2h45)"
                className="rounded-2xl"
              />
              <Input
                value={state.debrief.extraction}
                onChange={(e) => setState((p) => ({ ...p, debrief: { ...p.debrief, extraction: e.target.value } }))}
                placeholder="Extraction (ex: 18 min)"
                className="rounded-2xl"
              />
              <Input
                value={state.debrief.exterieur}
                onChange={(e) => setState((p) => ({ ...p, debrief: { ...p.debrief, exterieur: e.target.value } }))}
                placeholder="Extérieur (ex: 55 min)"
                className="rounded-2xl"
              />
              <Input
                value={state.debrief.interieur}
                onChange={(e) => setState((p) => ({ ...p, debrief: { ...p.debrief, interieur: e.target.value } }))}
                placeholder="Intérieur (ex: 75 min)"
                className="rounded-2xl"
              />
            </div>

            <Textarea
              value={state.debrief.tropLong}
              onChange={(e) => setState((p) => ({ ...p, debrief: { ...p.debrief, tropLong: e.target.value } }))}
              placeholder="Ce qui a pris trop de temps…"
              className="rounded-2xl min-h-[84px]"
            />
            <Textarea
              value={state.debrief.improvement}
              onChange={(e) => setState((p) => ({ ...p, debrief: { ...p.debrief, improvement: e.target.value } }))}
              placeholder="1 amélioration à appliquer la prochaine fois…"
              className="rounded-2xl min-h-[84px]"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-2xl"
                onClick={() => {
                  const payload = {
                    meta: state.meta,
                    globalElapsed: msToHMS(state.globalTimer.elapsedMs),
                    totals,
                    debrief: state.debrief,
                    exportedAt: new Date().toISOString(),
                  };
                  downloadText(`blackline_debrief_${state.meta.date || todayISO()}.json`, JSON.stringify(payload, null, 2));
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter Débrief
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    "Merci pour votre confiance 🙏\nSi le résultat vous satisfait, un avis Google nous aide énormément : <LIEN>"
                  );
                }}
              >
                Copier message avis
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-neutral-500 pb-6">
          Conseils terrain: activez le mode avion + luminosité max. La page sauvegarde automatiquement. Exportez en fin de prestation.
        </div>
      </div>
    </div>
  );
}