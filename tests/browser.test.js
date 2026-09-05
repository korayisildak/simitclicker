import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.TEST_URL || "http://127.0.0.1:8765/";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE
    ? { executablePath: process.env.BROWSER_EXECUTABLE }
    : {}),
});
await mkdir("test-results", { recursive: true });
const errors = [];
async function open(options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1440, height: 900 },
    reducedMotion: options.reducedMotion || "reduce",
  });
  if (options.save)
    await context.addInitScript(
      (data) =>
        localStorage.setItem("simitclicker-istanbul", JSON.stringify(data)),
      options.save,
    );
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(baseURL);
  await page.locator('[data-building="marti"]').waitFor();
  await page.locator("#saveStatus").filter({ hasText: "kayıt" }).waitFor();
  return { page, context };
}
const key = "simitclicker-istanbul";
const read = (page) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);

async function assertCompactViewport(page, { width, height }) {
  const size = `${width}×${height}`;
  const overflow = await page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth > innerWidth,
    vertical: document.documentElement.scrollHeight > innerHeight,
  }));
  assert.deepEqual(
    overflow,
    { horizontal: false, vertical: false },
    `The game fits the viewport at ${size}`,
  );
  const inventoryHeight = await page
    .locator(".inventory-scroll")
    .evaluate((el) => el.clientHeight);
  assert.ok(inventoryHeight >= 100, `Inventory tiles remain usable at ${size}`);
  for (const selector of ["#bakeButton", "#buySelected"]) {
    const box = await page.locator(selector).boundingBox();
    assert.ok(
      box &&
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= width + 1 &&
        box.y + box.height <= height + 1,
      `${selector} stays fully in the viewport at ${size}`,
    );
  }
}

try {
  const { page, context } = await open();
  assert.equal(await page.locator("#simitCount").textContent(), "0");
  assert.equal(await page.locator("[data-building]:visible").count(), 12);
  assert.equal(await page.locator("#buySelected").isDisabled(), true);
  assert.equal(
    await page.locator('[data-building="marti"]').isDisabled(),
    false,
    "Unaffordable items can still be inspected",
  );
  const initialCurrency = (await read(page)).simit;
  await page.locator('[data-building="tabla"]').click();
  assert.equal(
    await page.locator("#selectedName").textContent(),
    "Simitçi Tablası",
  );
  assert.equal((await read(page)).simit, initialCurrency);
  const lockedItem = page.locator('[data-building="tepe"]');
  assert.match(await lockedItem.getAttribute("class"), /is-locked/);
  await lockedItem.click();
  assert.equal(
    await page.locator("#selectedName").textContent(),
    "Yedi Tepe İmparatorluğu",
  );
  assert.equal(await page.locator("#buySelected").isDisabled(), true);
  assert.match(
    await page.locator("#selectedRequirement").textContent(),
    /Önce/,
  );
  assert.equal((await read(page)).simit, initialCurrency);
  await page.locator('[data-building="marti"]').click();
  assert.equal(await page.locator("#selectedName").textContent(), "Martı");

  // Saved music preferences never bypass the explicit music-button gesture.
  assert.equal(
    await page.locator("#musicToggle").getAttribute("data-playing"),
    "false",
  );
  assert.equal((await read(page)).settings.music, false);
  await page.locator("#musicToggle").click();
  await page.waitForFunction(
    () => document.querySelector("#musicToggle").dataset.playing === "true",
  );
  assert.equal((await read(page)).settings.music, true);
  await page.reload();
  await page.locator('[data-building="marti"]').waitFor();
  assert.equal(
    await page.locator("#musicToggle").getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator("#musicToggle").getAttribute("data-playing"),
    "false",
  );
  await page.locator("#musicToggle").click();
  await page.waitForFunction(
    () => document.querySelector("#musicToggle").dataset.playing === "true",
  );
  await page.locator("#musicToggle").click();
  await page.waitForFunction(
    () => document.querySelector("#musicToggle").dataset.playing === "false",
  );
  assert.equal((await read(page)).settings.music, false);

  const fullscreenSupported = await page.evaluate(() =>
    Boolean(
      document.fullscreenEnabled && document.documentElement.requestFullscreen,
    ),
  );
  await page.locator("#fullscreenToggle").click();
  if (fullscreenSupported) {
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    assert.equal(
      await page.locator("#fullscreenToggle").getAttribute("aria-pressed"),
      "true",
    );
    await page.locator("#fullscreenToggle").click();
    await page.waitForFunction(() => !document.fullscreenElement);
  } else {
    await page
      .getByText("Bu tarayıcı tam ekran geçişine izin vermiyor.", {
        exact: false,
      })
      .waitFor();
  }
  assert.equal(
    await page.locator("#fullscreenToggle").getAttribute("aria-pressed"),
    "false",
  );
  await assertCompactViewport(page, { width: 1440, height: 900 });
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.locator("#bakeButton").click({ clickCount: 12, delay: 35 });
  const currencyBeforeInspect = (await read(page)).simit;
  await page.locator('[data-building="marti"]').click();
  assert.equal((await read(page)).owned.marti, 0);
  assert.equal((await read(page)).simit, currencyBeforeInspect);
  assert.equal(await page.locator("#buySelected").isDisabled(), false);
  await page.locator("#buySelected").click();
  assert.equal((await read(page)).owned.marti, 1);
  assert.ok((await page.locator("#spsCount").textContent()) !== "0");
  assert.equal(await page.locator("#claimQuest").isDisabled(), false);
  await page.locator("#claimQuest").click();
  const questIndex = (await read(page)).questIndex;
  assert.ok(questIndex >= 1);
  await page.reload();
  await page.locator('[data-building="marti"]').waitFor();
  assert.equal((await read(page)).owned.marti, 1);
  assert.equal((await read(page)).questIndex, questIndex);

  // The second tab must not overwrite the first tab's progress.
  const second = await context.newPage();
  await second.goto(baseURL);
  await second.locator("#sessionNotice:not([hidden])").waitFor();
  assert.equal(await second.locator("#bakeButton").isDisabled(), true);
  await second.close();

  await page.locator("#shopTab").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.locator("#journeyTab").getAttribute("aria-selected"),
    "true",
  );
  assert.equal(await page.locator("#districts .district-card").count(), 7);
  await page.keyboard.press("End");
  assert.equal(await page.locator("#collectionPanel").isVisible(), true);
  assert.ok((await page.locator(".achievement-card").count()) >= 30);

  await page.locator("#settingsOpen").click();
  await page.locator("#soundSetting").check();
  await page.locator("#motionSetting").uncheck();
  assert.deepEqual((await read(page)).settings, {
    motion: false,
    sound: true,
    music: false,
    cursor: true,
  });
  await page.locator("#cursorSetting").uncheck();
  assert.equal(
    await page
      .locator("body")
      .evaluate((el) => el.classList.contains("native-cursor")),
    true,
  );
  assert.equal((await read(page)).settings.cursor, false);
  await page.locator("#cursorSetting").check();
  assert.equal(
    await page
      .locator("body")
      .evaluate((el) => el.classList.contains("native-cursor")),
    false,
  );
  assert.equal((await read(page)).settings.cursor, true);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportSave").click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /yedek.json/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#settingsDialog").isVisible(), false);

  await page.locator("#shareOpen").click();
  const cardDownload = page.waitForEvent("download");
  await page.locator("#downloadCard").click();
  assert.match((await cardDownload).suggestedFilename(), /kartim.png/);
  await page.keyboard.press("Escape");

  // Challenge has an independent clock and grants no main-game click income.
  await page.clock.install();
  const mainClicksBeforeRace = (await read(page)).clicks;
  await page.locator("#challengeOpen").click();
  await page.locator("#challengeStart").click();
  await page.locator("#challengeBake").click({ clickCount: 8 });
  assert.equal(await page.locator("#challengeScore").textContent(), "8");
  await page.clock.fastForward(30_100);
  assert.equal(await page.locator("#challengeBake").isDisabled(), true);
  assert.match(await page.locator("#challengeResult").textContent(), /8 simit/);
  await page.locator("#challengeShare").click();
  assert.equal(await page.locator("#shareNumber").textContent(), "8");
  assert.equal(
    (await read(page)).clicks,
    mainClicksBeforeRace,
    "Race clicks do not grant main-game clicks",
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value) => {
          window.copiedShare = value;
        },
      },
      configurable: true,
    }),
  );
  await page.locator("#copyShare").click();
  assert.match(await page.evaluate(() => window.copiedShare), /#race=8/);
  await context.close();

  const legacy = {
    v: 2,
    manual: true,
    simit: 1200,
    total: 13000,
    clicks: 125,
    golden: 2,
    owned: { marti: 8, tabla: 3, araba: 1 },
    upgrades: { c1: true, marti_u0: true },
    achievements: { a_t1: true },
    ts: 1,
  };
  const migrated = await open({ save: legacy });
  const saved = await read(migrated.page);
  assert.equal(saved.v, 3);
  assert.equal(saved.owned.marti, 8);
  assert.equal(saved.upgrades.c1, true);
  assert.equal(saved.achievements.a_t1, true);
  assert.ok(saved.simit < 1210, "No offline windfall is granted");
  assert.ok(
    await migrated.page.evaluate(
      (k) => localStorage.getItem(`${k}-before-v3`),
      key,
    ),
  );
  const recipeCurrency = (await read(migrated.page)).simit;
  await migrated.page.locator('[data-upgrade="tabla_u0"]').click();
  assert.equal(
    await migrated.page.locator("#selectedName").textContent(),
    "Dengeli Tabla",
  );
  assert.equal((await read(migrated.page)).simit, recipeCurrency);
  assert.equal((await read(migrated.page)).upgrades.tabla_u0, undefined);
  await migrated.page.locator("#buySelected").click();
  assert.equal((await read(migrated.page)).upgrades.tabla_u0, true);
  assert.equal(
    await migrated.page.locator('[data-upgrade="tabla_u0"]').isVisible(),
    true,
  );
  assert.match(
    await migrated.page
      .locator('[data-upgrade="tabla_u0"]')
      .getAttribute("class"),
    /is-learned/,
  );
  assert.equal(await migrated.page.locator("#buySelected").isDisabled(), true);
  await migrated.page.locator('[data-quantity="max"]').click();
  await migrated.page.locator('[data-building="marti"]').click();
  await migrated.page.locator("#buySelected").click();
  assert.ok((await read(migrated.page)).owned.marti > 8);
  assert.ok((await read(migrated.page)).simit >= 0);
  await migrated.context.close();

  const viewports = [
    { width: 360, height: 640 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 768, height: 844 },
    { width: 1440, height: 900 },
    { width: 844, height: 390 },
  ];
  for (const viewport of viewports) {
    const { width, height } = viewport;
    const mobile = await open({ viewport });
    await assertCompactViewport(mobile.page, viewport);
    await mobile.page.screenshot({
      path:
        width === 1440
          ? "test-results/desktop.png"
          : `test-results/mobile-${width}${height === 390 ? "-landscape" : ""}.png`,
      fullPage: true,
    });
    await mobile.page
      .locator("#bakeButton")
      .tap()
      .catch(() => mobile.page.locator("#bakeButton").click());
    assert.notEqual(
      await mobile.page.locator("#simitCount").textContent(),
      "0",
    );
    await mobile.context.close();
  }

  // A developed inventory scrolls internally while the purchase area stays fixed.
  const developed = await open({
    save: {
      v: 3,
      simit: 1e12,
      total: 1e12,
      owned: Object.fromEntries(
        [
          "marti",
          "tabla",
          "araba",
          "firin",
          "cay",
          "carsi",
          "vapur",
          "tramvay",
          "galata",
          "kopru",
          "kiz",
          "tepe",
        ].map((id) => [id, 25]),
      ),
    },
  });
  for (const viewport of viewports) {
    await developed.page.setViewportSize(viewport);
    const before = await developed.page.locator("#buySelected").boundingBox();
    const scroll = await developed.page
      .locator(".inventory-scroll")
      .evaluate((el) => {
        el.scrollTop = el.scrollHeight;
        return {
          top: el.scrollTop,
          height: el.clientHeight,
          content: el.scrollHeight,
        };
      });
    assert.ok(
      scroll.content > scroll.height && scroll.top > 0,
      `The inventory itself scrolls at ${viewport.width}×${viewport.height}`,
    );
    const after = await developed.page.locator("#buySelected").boundingBox();
    assert.equal(
      after.y,
      before.y,
      "Purchasing stays fixed while the inventory scrolls",
    );
    await assertCompactViewport(developed.page, viewport);
  }
  await developed.context.close();
  const invite = await open();
  await invite.page.goto(`${baseURL}#race=72`);
  await invite.page.reload();
  await invite.page.locator("#challengeInvite:not([hidden])").waitFor();
  assert.match(await invite.page.locator("#inviteText").textContent(), /72/);
  await invite.context.close();
  assert.deepEqual(errors, [], "No browser errors");
  console.log(
    "Browser checks passed: inventory inspection/purchasing, locked slots, recipes, quests, save/reload, migration, multi-tab, keyboard, settings, music, cursor, fullscreen, export, sharing, timed challenge, compact desktop/mobile/landscape layouts and internal scrolling.",
  );
} finally {
  await browser.close();
}
