import { useEffect, useState } from "react";
import type { PracticeSessionProps } from "../types/local.ts";

const STORAGE_KEY = "pta_instruments_v1";

function loadInstruments(): { id: number; name: string }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultInstruments();
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (p) => p && typeof p.id === "number" && typeof p.name === "string",
      )
    ) {
      return parsed;
    }
    return defaultInstruments();
  } catch {
    return defaultInstruments();
  }
}

function saveInstruments(list: { id: number; name: string }[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
    console.warn("Failed to save instruments", e);
  }
}

function defaultInstruments() {
  // Per request: default should be just the Violin
  return [{ id: Date.now(), name: "Violin" }];
}

export function PracticeSession({
  isActive,
  onStart,
  onStop,
  instrumentId,
  onInstrumentChange,
}: PracticeSessionProps) {
  const [instruments, setInstruments] = useState<
    { id: number; name: string }[]
  >(() => loadInstruments());
  const [managerOpen, setManagerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    saveInstruments(instruments);
  }, [instruments]);

  const current = instruments.find((i) => i.id === instrumentId) ||
    instruments[0] || { id: 0, name: "No instrument" };

  const handleAddOpen = () => {
    setAddName("");
    setAddOpen(true);
  };

  const handleAddSave = () => {
    const name = addName.trim();
    if (!name) return;
    const id = Date.now();
    const next = [...instruments, { id, name }];
    setInstruments(next);
    setAddOpen(false);
    onInstrumentChange?.(id);
  };

  const handleDelete = (id: number) => {
    if (instruments.length <= 1) {
      // prevent deleting last instrument
      alert("You must have at least one instrument.");
      return;
    }
    if (!confirm("Delete this instrument?")) return;
    const next = instruments.filter((i) => i.id !== id);
    setInstruments(next);
    if (id === instrumentId) {
      onInstrumentChange?.(next[0].id);
    }
  };

  const startEditing = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = () => {
    if (editingId == null) return;
    const name = editingName.trim();
    if (!name) return;
    setInstruments((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, name } : p)),
    );
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-4">
      {/* Current instrument header with Manage button */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-200">
            Current Instrument
          </label>
          <div className="mt-1 text-lg font-semibold">{current.name}</div>
        </div>

        <div>
          <button
            className="px-3 py-1 rounded bg-white/6"
            onClick={() => setManagerOpen((s) => !s)}
            aria-expanded={managerOpen}
          >
            {managerOpen ? "Close" : "Manage"}
          </button>
        </div>
      </div>

      {/* Manager panel appears when Manage clicked */}
      {managerOpen && (
        <div className="p-2 border rounded bg-white/3">
          {/* Instrument list */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Instruments
            </label>
            <div className="space-y-2">
              {instruments.map((ins) => (
                <div key={ins.id} className="flex items-center gap-2">
                  {editingId === ins.id ? (
                    <>
                      <input
                        className="flex-1 rounded px-2 py-1 bg-white/5"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                      <button
                        className="px-2 py-1 rounded bg-blue-600 text-white"
                        onClick={saveEdit}
                        aria-label={`Save name for ${ins.name}`}
                      >
                        Save
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-gray-600 text-white"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        aria-label="Cancel edit"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={`flex-1 text-left px-3 py-2 rounded ${ins.id === instrumentId ? "bg-white/10" : ""}`}
                        onClick={() => onInstrumentChange?.(ins.id)}
                        aria-pressed={ins.id === instrumentId}
                        disabled={isActive}
                      >
                        {ins.name}
                      </button>

                      {/* Explicit select icon/button */}
                      <button
                        className="px-2 py-1 rounded bg-white/6"
                        onClick={() =>
                          !isActive && onInstrumentChange?.(ins.id)
                        }
                        aria-label={`Select ${ins.name}`}
                        title="Select"
                        disabled={isActive}
                      >
                        ↪
                      </button>

                      {/* Edit (pencil) */}
                      <button
                        className="px-2 py-1 rounded bg-white/6"
                        onClick={() =>
                          !isActive && startEditing(ins.id, ins.name)
                        }
                        aria-label={`Rename ${ins.name}`}
                        disabled={isActive}
                      >
                        ✎
                      </button>

                      {/* Delete (-) */}
                      <button
                        className="px-2 py-1 rounded bg-red-600 text-white"
                        onClick={() => !isActive && handleDelete(ins.id)}
                        aria-label={`Delete ${ins.name}`}
                        disabled={isActive}
                      >
                        −
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add button / dialog */}
          <div className="mt-3">
            {addOpen ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                  Add Instrument
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded px-2 py-1 bg-white/5"
                    placeholder="Instrument name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                  />
                  <button
                    className="px-4 py-1 rounded bg-green-600 text-white"
                    onClick={handleAddSave}
                  >
                    Add
                  </button>
                  <button
                    className="px-4 py-1 rounded bg-gray-600 text-white"
                    onClick={() => setAddOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="w-full px-4 py-2 rounded bg-white/6 text-center font-semibold"
                onClick={handleAddOpen}
                aria-label="Add instrument"
              >
                + Add Instrument
              </button>
            )}
          </div>
        </div>
      )}

      {/* Start/Stop controls always visible */}
      <div>
        {isActive ? (
          <button
            className="w-full px-3 py-1 rounded bg-red-600"
            onClick={onStop}
          >
            Stop Practice Session
          </button>
        ) : (
          <button
            className="w-full px-3 py-1 rounded bg-green-600"
            onClick={onStart}
          >
            Start New Session
          </button>
        )}
      </div>
    </div>
  );
}
