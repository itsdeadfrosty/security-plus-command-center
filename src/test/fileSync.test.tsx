import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider } from "@/lib/store";
import { FileSyncProvider } from "@/lib/storage/fileSync";
import { FileSyncCard } from "@/components/FileSyncCard";
import { parseImport } from "@/lib/storage/schema";

function renderCard() {
  return render(
    <AppProvider>
      <FileSyncProvider>
        <FileSyncCard />
      </FileSyncProvider>
    </AppProvider>,
  );
}

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).showSaveFilePicker;
});

describe("save progress to a file", () => {
  it("falls back to export instructions when the browser can't write files", () => {
    renderCard();
    expect(screen.getByRole("button", { name: /Save a copy/ })).toBeTruthy();
  });

  it("writes a valid progress file to the chosen location", async () => {
    let written = "";
    const handle = {
      name: "secplus-progress.json",
      getFile: vi.fn(),
      createWritable: async () => ({ write: async (d: string) => void (written = d), close: async () => undefined }),
      queryPermission: async () => "granted",
      requestPermission: async () => "granted",
    };
    const picker = vi.fn(async () => handle);
    (window as unknown as Record<string, unknown>).showSaveFilePicker = picker;

    renderCard();
    await act(async () => {
      await userEvent.click(await screen.findByRole("button", { name: /Choose save file/ }));
    });

    expect(picker).toHaveBeenCalledWith(expect.objectContaining({ startIn: "documents", suggestedName: "secplus-progress.json" }));
    await waitFor(() => expect(written).not.toBe(""));
    expect(parseImport(written).profile).toBeTruthy();
    expect(await screen.findByText(/Saving to/)).toBeTruthy();
  });
});
