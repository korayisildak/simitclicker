import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILDINGS,
  UPGRADES,
  DISTRICTS,
  QUESTS,
  MAX_CURRENCY,
  MAX_OWNED,
  createState,
  normalizeSave,
  derive,
  priceFor,
  affordableCount,
  buyBuilding,
  buyUpgrade,
  click,
  advance,
  earn,
  currentQuest,
  claimQuest,
  collectGolden,
} from "../engine.js";

test("first helper is reachable in twelve clicks and passive income starts immediately", () => {
  const s = createState();
  for (let i = 0; i < 12; i++) click(s);
  assert.equal(s.simit, 12);
  assert.equal(buyBuilding(s, "marti").ok, true);
  assert.equal(s.simit, 0);
  assert.equal(s.owned.marti, 1);
  assert.equal(derive(s).sps, 0.4);
  advance(s, 0.5);
  assert.equal(s.simit, 0.2);
  assert.equal(s.total, 12.2);
});

test("transactions reject unavailable purchases without changing currency", () => {
  const s = createState();
  for (const count of [0, -1, 1.5, Infinity, "max"])
    assert.equal(buyBuilding(s, "marti", count).ok, false);
  assert.equal(buyBuilding(s, "__proto__", 1).ok, false);
  assert.equal(buyUpgrade(s, "marti_u0").ok, false);
  assert.equal(s.simit, 0);
  assert.equal(s.owned.marti, 0);
});

test("bulk quotes match the escalating series and max purchase stays within budget", () => {
  const s = createState();
  earn(s, 10000);
  const expected = Math.ceil(
    Array.from({ length: 10 }, (_, i) => 12 * 1.15 ** i).reduce(
      (a, b) => a + b,
      0,
    ),
  );
  assert.equal(priceFor(s, "marti", 10), expected);
  const count = affordableCount(s, "marti");
  assert.ok(priceFor(s, "marti", count) <= s.simit);
  assert.ok(priceFor(s, "marti", count + 1) > s.simit);
  const total = s.total;
  assert.equal(buyBuilding(s, "marti", "max").count, count);
  assert.ok(s.simit >= 0);
  assert.equal(s.total, total);
});

test("upgrades are single purchases and per-unit store rates are independent of count", () => {
  const s = createState();
  earn(s, 200);
  buyBuilding(s, "marti", 2);
  assert.equal(derive(s).buildingSps.marti, 0.4);
  assert.equal(derive(s).sps, 0.8);
  assert.equal(buyUpgrade(s, "marti_u0").ok, true);
  assert.equal(derive(s).sps, 1.6);
  const balance = s.simit;
  assert.equal(buyUpgrade(s, "marti_u0").ok, false);
  assert.equal(s.simit, balance);
  assert.ok(derive(s).clickPower > 1);
});

test("districts follow lifetime production and spending cannot undo a level", () => {
  const s = createState();
  const result = earn(s, DISTRICTS[1].threshold);
  assert.equal(result.districtChanged, true);
  assert.equal(derive(s).districtIndex, 1);
  buyBuilding(s, "tabla");
  assert.equal(derive(s).districtIndex, 1);
  assert.equal(derive(s).baseSps, 2.5 * 1.05);
});

test("quests are explicit one-time claims, not automatically chained reward grants", () => {
  const s = createState();
  assert.equal(claimQuest(s).ok, false);
  for (let i = 0; i < 10; i++) click(s);
  assert.equal(currentQuest(s).ready, true);
  assert.equal(claimQuest(s).amount, 5);
  assert.equal(s.questIndex, 1);
  assert.equal(claimQuest(s).ok, false);
  buyBuilding(s, "marti");
  assert.equal(claimQuest(s).ok, true);
  assert.equal(s.questIndex, 2);
  assert.equal(claimQuest(s).ok, false);
});

test("golden production lasts 45 active seconds and integrates partial expiry correctly", () => {
  const s = createState();
  earn(s, 12);
  buyBuilding(s, "marti");
  collectGolden(s);
  assert.equal(derive(s).sps, 0.8);
  assert.equal(s.golden, 1);
  s.activeSeconds = 44.75;
  const before = s.simit;
  advance(s, 0.5);
  assert.ok(Math.abs(s.simit - before - 0.3) < 1e-8);
  assert.equal(derive(s).sps, 0.4);
  assert.equal(derive(s).buffRemaining, 0);
});

test("negative and large timer gaps cannot drain currency or grant offline jackpots", () => {
  const s = createState();
  earn(s, 12);
  buyBuilding(s, "marti");
  assert.equal(advance(s, -1).amount, 0);
  assert.equal(advance(s, NaN).amount, 0);
  assert.equal(advance(s, 86400).amount, 0.4);
  assert.equal(s.activeSeconds, 1);
});

test("v2 saves preserve progress, upgrades and achievements without offline rewards", () => {
  const s = normalizeSave(
    {
      v: 2,
      simit: 120,
      total: 1000,
      clicks: 13,
      golden: 1,
      owned: { marti: 5, tabla: 2 },
      upgrades: { c1: true, marti_u0: true },
      achievements: { a_t1: true },
      ts: 1,
    },
    1e12,
  );
  assert.equal(s.v, 3);
  assert.equal(s.simit, 120);
  assert.equal(s.total, 1000);
  assert.equal(s.owned.marti, 5);
  assert.equal(s.upgrades.marti_u0, true);
  assert.equal(s.achievements.a_t1, true);
  assert.equal(s.goldenUntil, 0);
  assert.equal(s.activeSeconds, 0);
});

test("v1 ids are remapped together with their upgrades and achievements", () => {
  const s = normalizeSave({
    v: 1,
    simit: 0,
    owned: { el: 3, marti: 4 },
    upgrades: { el_u1: true, marti_u0: true },
    achievements: { a_el_1: true, a_marti_2: true },
  });
  assert.equal(s.owned.marti, 3);
  assert.equal(s.owned.tramvay, 4);
  assert.equal(s.upgrades.marti_u1, true);
  assert.equal(s.upgrades.tramvay_u0, true);
  assert.equal(s.achievements.a_marti_1, true);
  assert.equal(s.achievements.a_tramvay_2, true);
});

test("untrusted saves only retain known own fields and bounded finite numbers", () => {
  const s = normalizeSave(
    JSON.parse(
      '{"v":3,"simit":-5,"total":5,"clicks":-1,"owned":{"marti":1e300,"tabla":-8,"intruder":99,"__proto__":{"polluted":true}},"upgrades":{"c1":"true","intruder":true},"questIndex":999,"settings":{"motion":false,"sound":"yes"}}',
    ),
  );
  assert.equal(s.simit, 0);
  assert.equal(s.clicks, 0);
  assert.equal(s.owned.marti, MAX_OWNED);
  assert.equal(s.owned.tabla, 0);
  assert.equal(Object.hasOwn(s.owned, "intruder"), false);
  assert.equal(s.upgrades.c1, undefined);
  assert.equal(s.settings.motion, false);
  assert.equal(s.settings.sound, false);
  assert.equal(s.questIndex, QUESTS.length);
  assert.equal({}.polluted, undefined);
  for (const input of [null, [], true, "bad"])
    assert.equal(normalizeSave(input).simit, 0);
  assert.equal(normalizeSave({ simit: Infinity }).simit, 0);
});

test("currency and ownership limits keep quotes and totals finite", () => {
  const s = createState();
  earn(s, MAX_CURRENCY);
  earn(s, MAX_CURRENCY);
  assert.equal(s.simit, MAX_CURRENCY);
  assert.equal(s.total, MAX_CURRENCY);
  s.owned.marti = MAX_OWNED;
  assert.equal(affordableCount(s, "marti"), 0);
  assert.equal(buyBuilding(s, "marti").ok, false);
  assert.ok(Number.isFinite(derive(s).sps));
});

test("a modest active player can reach the second district in under three minutes", () => {
  const s = createState();
  let firstHelper, nextDistrict;
  for (let second = 0; second < 180; second++) {
    click(s);
    click(s);
    advance(s, 1);
    while (currentQuest(s)?.ready) claimQuest(s);
    const options = BUILDINGS.filter((b) => priceFor(s, b.id) <= s.simit).sort(
      (a, b) => priceFor(s, a.id) / a.sps - priceFor(s, b.id) / b.sps,
    );
    if (options.length) buyBuilding(s, options[0].id);
    if (s.owned.marti && firstHelper === undefined) firstHelper = second;
    if (derive(s).districtIndex >= 1) {
      nextDistrict = second;
      break;
    }
  }
  assert.ok(firstHelper < 15, `First helper at ${firstHelper}s`);
  assert.ok(nextDistrict < 180, `Second district at ${nextDistrict}s`);
});

test("all legacy building ids and 42 upgrades remain available", () => {
  assert.equal(BUILDINGS.length, 12);
  assert.equal(UPGRADES.length, 42);
  assert.equal(new Set(BUILDINGS.map((b) => b.id)).size, 12);
  assert.equal(new Set(UPGRADES.map((b) => b.id)).size, 42);
});
