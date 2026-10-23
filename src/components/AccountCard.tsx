"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, RefreshCw, UserRound } from "lucide-react";
import { useAccount } from "@/lib/storage/cloudSync";
import { Button, Card, CardTitle } from "./ui";

const inputCls = "min-h-11 w-full max-w-xs rounded-lg border border-line bg-surface-2 px-3";

/** Settings card: sign in so progress is saved online and follows you to any device. */
export function AccountCard() {
  const account = useAccount();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    if (mode === "sign-in") await account.signIn(email, password);
    else await account.signUp(email, password);
    setBusy(false);
    setPassword("");
  }

  async function reset() {
    setBusy(true);
    setNote(await account.resetPassword(email));
    setBusy(false);
  }

  const signedIn = account.status === "on" || account.status === "syncing" || (account.status === "error" && account.email);

  return (
    <Card className="mb-4" aria-labelledby="account-h">
      <span id="account" className="relative -top-20 block" aria-hidden />
      <CardTitle id="account-h" icon={<UserRound className="size-4" aria-hidden />}>
        Your account
      </CardTitle>

      {account.status === "loading" ? (
        <p className="text-sm text-muted">Checking sign-in…</p>
      ) : signedIn ? (
        <>
          <p className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            Signed in as {account.email}
            {account.lastSynced && (
              <span className="text-muted">· saved {account.lastSynced.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void account.syncNow()} disabled={account.status === "syncing"}>
              <RefreshCw className="size-4" aria-hidden /> Save now
            </Button>
            <Button variant="ghost" onClick={() => void account.signOut()}>
              Sign out
            </Button>
          </div>
          {account.status === "syncing" && <p className="mt-3 text-sm text-muted">Saving…</p>}
        </>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <p className="text-sm text-muted">
            {mode === "sign-in" ? "Sign in" : "Make a free account"} to save your progress online and pick up on any device. Progress you already have here is
            kept and added to your account.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary" disabled={busy}>
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>
              {mode === "sign-in" ? "New here? Create an account" : "Have an account? Sign in"}
            </Button>
            {mode === "sign-in" && (
              <Button type="button" variant="ghost" disabled={busy || !email.trim()} onClick={() => void reset()}>
                Forgot password
              </Button>
            )}
          </div>
          {note && <p className="text-sm text-muted">{note}</p>}
        </form>
      )}

      {account.error && (
        <p role="status" className="mt-3 text-sm text-danger">
          {account.error}
        </p>
      )}
    </Card>
  );
}
