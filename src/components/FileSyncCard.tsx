"use client";

import { useState } from "react";
import { FileCheck2, FolderOpen, Save, Share } from "lucide-react";
import { useStore } from "@/lib/store";
import { serializeExport } from "@/lib/storage/schema";
import { useFileSync } from "@/lib/storage/fileSync";
import { Button, Card, CardTitle } from "./ui";

/** Settings card: keep progress auto-saved to a file the learner chooses (e.g. in Documents). */
export function FileSyncCard() {
  const fs = useFileSync();
  const { data } = useStore();
  const [copyNote, setCopyNote] = useState<string>();

  /** Share sheet where available (iOS "Save to Files"), otherwise a normal download. */
  async function saveCopy() {
    const name = "secplus-progress.json";
    const text = serializeExport(data, new Date());
    const file = new File([text], name, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Security+ progress" });
        setCopyNote("Saved. Use Import progress to load it later.");
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCopyNote("Downloaded. Use Import progress to load it later.");
  }
  return (
    <Card className="mb-4" aria-labelledby="filesync-h">
      <CardTitle id="filesync-h" icon={<Save className="size-4" aria-hidden />}>
        Save progress to a file
      </CardTitle>

      {fs.status === "unsupported" ? (
        <>
          <p className="mb-3 text-sm text-muted">
            On iPhone, iPad and browsers like Safari or Firefox, tap <strong>Save a copy</strong> and choose <strong>Save to Files</strong> (or any folder).
            Do this after you study. To pick up where you left off, use <strong>Import progress</strong> below and choose that file.
          </p>
          <Button variant="primary" onClick={() => void saveCopy()}>
            <Share className="size-4" aria-hidden /> Save a copy
          </Button>
          {copyNote && (
            <p role="status" className="mt-3 text-sm text-success">
              {copyNote}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            Pick a file once (for example in Documents) and the app keeps it updated as you study. If you clear your browser or move to another computer,
            choose <strong>Load from a file</strong> to pick up where you left off.
          </p>

          {fs.fileName && (
            <p className="mb-3 flex flex-wrap items-center gap-2 text-sm" role="status">
              <FileCheck2 className="size-4 text-success" aria-hidden />
              <span>
                {fs.status === "on" ? "Saving to" : "Save file:"} <span className="font-medium">{fs.fileName}</span>
                {fs.status === "on" && fs.lastSaved && <span className="text-muted"> · last saved {fs.lastSaved.toLocaleTimeString()}</span>}
                {fs.status === "needs-permission" && <span className="text-warning"> · paused, needs your OK</span>}
              </span>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {fs.status === "needs-permission" && (
              <Button variant="primary" onClick={() => void fs.resume()}>
                Resume saving
              </Button>
            )}
            <Button variant={fs.fileName ? "secondary" : "primary"} onClick={() => void fs.chooseNewFile()}>
              <Save className="size-4" aria-hidden /> {fs.fileName ? "Save to a different file" : "Choose save file"}
            </Button>
            <Button onClick={() => void fs.openExistingFile()}>
              <FolderOpen className="size-4" aria-hidden /> Load from a file
            </Button>
            {fs.fileName && (
              <Button variant="ghost" onClick={() => void fs.stop()}>
                Stop saving to file
              </Button>
            )}
          </div>
        </>
      )}

      {fs.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {fs.error}
        </p>
      )}
    </Card>
  );
}
