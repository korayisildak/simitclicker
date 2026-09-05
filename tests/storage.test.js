import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

const SAVE_KEY = "simitclicker-istanbul";
let moduleVersion = 0;
let previousStorageDescriptor;

function memoryStorage(entries = {}, failWrites = false) {
  const records = new Map(Object.entries(entries));
  return {
    records,
    failWrites,
    getItem(key) {
      return records.has(key) ? records.get(key) : null;
    },
    setItem(key, value) {
      if (this.failWrites)
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      records.set(String(key), String(value));
    },
    removeItem(key) {
      records.delete(key);
    },
  };
}

function legacySave(overrides = {}) {
  return {
    v: 2,
    simit: 120,
    total: 250,
    clicks: 75,
    golden: 1,
    owned: { marti: 3, tabla: 1 },
    ...overrides,
  };
}

async function loadStorage(mock) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: mock,
  });
  // A fresh module also resets its write-protection flag for each scenario.
  return import(`../storage.js?storage-test=${++moduleVersion}`);
}

describe("save storage and progress recovery", { concurrency: false }, () => {
  beforeEach(() => {
    previousStorageDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage",
    );
  });

  afterEach(() => {
    if (previousStorageDescriptor)
      Object.defineProperty(
        globalThis,
        "localStorage",
        previousStorageDescriptor,
      );
    else delete globalThis.localStorage;
  });

  it("backs up a valid legacy save before allowing the migrated save to replace it", async () => {
    const original = JSON.stringify(legacySave());
    const disk = memoryStorage({ [SAVE_KEY]: original });
    const storage = await loadStorage(disk);
    const loaded = storage.readSave();

    assert.equal(loaded.migrated, true);
    assert.equal(loaded.backedUp, true);
    assert.equal(loaded.state.v, 3);
    assert.equal(loaded.state.simit, 120);
    assert.equal(loaded.state.owned.marti, 3);
    assert.equal(loaded.state.owned.tabla, 1);
    assert.equal(disk.getItem(`${SAVE_KEY}-before-v3`), original);
    assert.equal(disk.getItem(SAVE_KEY), original);

    assert.equal(storage.saveState(loaded.state), true);
    assert.equal(JSON.parse(disk.getItem(SAVE_KEY)).v, 3);
    assert.equal(disk.getItem(`${SAVE_KEY}-before-v3`), original);
  });

  it("preserves an existing pre-migration backup", async () => {
    const firstBackup = JSON.stringify(legacySave({ simit: 15 }));
    const disk = memoryStorage({
      [SAVE_KEY]: JSON.stringify(legacySave()),
      [`${SAVE_KEY}-before-v3`]: firstBackup,
    });
    const storage = await loadStorage(disk);

    assert.equal(storage.readSave().backedUp, true);
    assert.equal(disk.getItem(`${SAVE_KEY}-before-v3`), firstBackup);
  });

  it("protects corrupt disk data while exporting the latest memory-only progress", async () => {
    const original = '{"simit":unfinished';
    const disk = memoryStorage({ [SAVE_KEY]: original });
    const storage = await loadStorage(disk);
    const loaded = storage.readSave();

    assert.ok(loaded.error);
    assert.equal(loaded.state.simit, 0);
    loaded.state.simit = 45;
    loaded.state.total = 45;
    assert.equal(storage.saveState(loaded.state), false);
    assert.equal(disk.getItem(SAVE_KEY), original);
    assert.equal(JSON.parse(storage.saveBackup(loaded.state)).simit, 45);
  });

  it("exports new play after a legacy-backup quota error instead of exporting the old disk save", async () => {
    const original = JSON.stringify(legacySave());
    const disk = memoryStorage({ [SAVE_KEY]: original }, true);
    const storage = await loadStorage(disk);
    const loaded = storage.readSave();

    assert.equal(loaded.backedUp, false);
    assert.equal(loaded.state.simit, 120);
    loaded.state.simit += 35;
    loaded.state.total += 35;
    assert.equal(storage.saveState(loaded.state), false);
    assert.equal(loaded.state.simit, 155);
    assert.equal(disk.getItem(SAVE_KEY), original);
    const exported = JSON.parse(storage.saveBackup(loaded.state));
    assert.equal(exported.simit, 155);
    assert.equal(exported.total, 285);
    assert.equal(exported.v, 3);
  });

  it("keeps memory progress on an ordinary write failure and retries when storage recovers", async () => {
    const disk = memoryStorage({}, true);
    const storage = await loadStorage(disk);
    const { state } = storage.readSave();
    state.simit = 72;
    state.total = 72;

    assert.equal(storage.saveState(state), false);
    assert.equal(state.simit, 72);
    assert.equal(JSON.parse(storage.saveBackup(state)).simit, 72);
    assert.equal(disk.getItem(SAVE_KEY), null);
    disk.failWrites = false;
    assert.equal(storage.saveState(state), true);
    assert.equal(JSON.parse(disk.getItem(SAVE_KEY)).simit, 72);
  });

  it("does not overwrite a save from an unsupported newer version", async () => {
    const original = JSON.stringify(legacySave({ v: 99, simit: 200 }));
    const disk = memoryStorage({ [SAVE_KEY]: original });
    const storage = await loadStorage(disk);
    const loaded = storage.readSave();

    assert.ok(loaded.error);
    assert.equal(storage.saveState(loaded.state), false);
    assert.equal(disk.getItem(SAVE_KEY), original);
    assert.equal(disk.getItem(`${SAVE_KEY}-before-v3`), null);
  });

  it("backs up current progress and normalizes an imported legacy save", async () => {
    const original = JSON.stringify(legacySave({ simit: 99 }));
    const disk = memoryStorage({ [SAVE_KEY]: original });
    const storage = await loadStorage(disk);
    const imported = storage.replaceSave({
      v: 2,
      simit: 42,
      total: 100,
      clicks: -10,
      owned: { marti: 2 },
    });

    assert.equal(disk.getItem(`${SAVE_KEY}-before-import`), original);
    assert.equal(imported.v, 3);
    assert.equal(imported.simit, 42);
    assert.equal(imported.owned.marti, 2);
    assert.equal(imported.owned.tabla, 0);
    assert.equal(imported.clicks, 0);
    assert.equal(typeof imported.settings.motion, "boolean");
    assert.deepEqual(JSON.parse(disk.getItem(SAVE_KEY)), imported);
    assert.equal(storage.saveState(imported), true);
  });

  it("leaves the existing save untouched when an import is invalid or cannot be backed up", async () => {
    const original = JSON.stringify(legacySave());
    const disk = memoryStorage({ [SAVE_KEY]: original });
    const storage = await loadStorage(disk);

    assert.throws(() => storage.replaceSave({ text: "not a game save" }));
    assert.equal(disk.getItem(SAVE_KEY), original);
    assert.equal(disk.getItem(`${SAVE_KEY}-before-import`), null);

    disk.failWrites = true;
    assert.throws(() => storage.replaceSave(legacySave({ simit: 50 })));
    assert.equal(disk.getItem(SAVE_KEY), original);
  });
});
