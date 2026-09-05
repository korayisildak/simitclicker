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
    viewport: options.viewport || { width: 1440, height: 1050 },
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
try {
  const { page, context } = await open();
  assert.equal(await page.locator("#simitCount").textContent(), "0");
  assert.equal(
    await page.locator('[data-building="marti"]').isDisabled(),
    true,
  );
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.locator("#bakeButton").click({ clickCount: 12, delay: 35 });
  await page.locator('[data-building="marti"]').click();
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
  assert.deepEqual((await read(page)).settings, { motion: false, sound: true });
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
  await migrated.page.locator('[data-quantity="max"]').click();
  await migrated.page.locator('[data-building="marti"]').click();
  assert.ok((await read(migrated.page)).owned.marti > 8);
  assert.ok((await read(migrated.page)).simit >= 0);
  await migrated.context.close();

  for (const width of [390, 768]) {
    const mobile = await open({ viewport: { width, height: 844 } });
    assert.equal(
      await mobile.page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `No horizontal overflow at ${width}px`,
    );
    await mobile.page.screenshot({
      path: `test-results/mobile-${width}.png`,
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
    await mobile.page.locator("#jumpShop").click();
    assert.equal(
      await mobile.page.locator("#shopTab").getAttribute("aria-selected"),
      "true",
    );
    assert.ok((await mobile.page.locator("#shopTab").boundingBox()).y < 100);
    await mobile.context.close();
  }
  const invite = await open();
  await invite.page.goto(`${baseURL}#race=72`);
  await invite.page.reload();
  await invite.page.locator("#challengeInvite:not([hidden])").waitFor();
  assert.match(await invite.page.locator("#inviteText").textContent(), /72/);
  await invite.context.close();
  assert.deepEqual(errors, [], "No browser errors");
  console.log(
    "Browser checks passed: purchasing, quests, save/reload, migration, multi-tab, keyboard, settings, export, sharing, timed challenge, mobile layouts.",
  );
} finally {
  await browser.close();
}
