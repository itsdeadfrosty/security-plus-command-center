"use client";

/**
 * Account sign-in and cloud save through Firebase (free Spark plan). Each
 * learner's progress lives in one Firestore document, users/{uid}, which the
 * security rules let only that signed-in user read or write. Like the Gist sync,
 * every save reads the cloud copy, merges (nothing from either device is lost),
 * then writes the result back. Firebase keeps the passwords; the app never sees
 * them after sign-in.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type Auth,
} from "firebase/auth";
import { Bytes, doc, getDoc, getFirestore, serverTimestamp, setDoc, type Firestore } from "firebase/firestore";
import { useStore } from "@/lib/store";
import { mergeAppData } from "@/lib/engine/blitz";
import type { AppData } from "@/lib/types";
import { parseImport, serializeExport } from "./schema";

// Firebase web config is public by design: access is enforced by the security rules.
const firebaseConfig = {
  apiKey: "AIzaSyBbV6JBdVGg0H5GlmYLoeKzD1tmgnMZw1s",
  authDomain: "secplus-command-center-bea34.firebaseapp.com",
  projectId: "secplus-command-center-bea34",
  storageBucket: "secplus-command-center-bea34.firebasestorage.app",
  messagingSenderId: "1040860077264",
  appId: "1:1040860077264:web:6953846fce20c60580d2d5",
};

export type AccountStatus = "loading" | "signed-out" | "syncing" | "on" | "error";

interface Account {
  status: AccountStatus;
  email?: string;
  lastSynced?: Date;
  error?: string;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  resetPassword(email: string): Promise<string>;
  signOut(): Promise<void>;
  syncNow(): Promise<void>;
}

const Ctx = createContext<Account | null>(null);

let fb: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;
function firebase() {
  if (!fb) {
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    fb = { app, auth: getAuth(app), db: getFirestore(app) };
  }
  return fb;
}

/** Plain-English text for Firebase's error codes. */
function message(e: unknown, fallback: string): string {
  const code = (e as { code?: string })?.code ?? "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "Wrong email or password.";
  if (code === "auth/email-already-in-use") return "There's already an account with that email. Sign in instead.";
  if (code === "auth/invalid-email") return "That email address doesn't look right.";
  if (code === "auth/weak-password") return "Pick a password with at least 6 characters.";
  if (code === "auth/too-many-requests") return "Too many tries. Wait a few minutes and try again.";
  if (code === "auth/network-request-failed" || code === "unavailable") return "Couldn't reach the server. Check your connection.";
  return fallback;
}

// Progress is gzipped so a long study history stays well under Firestore's 1 MB document limit.
async function gzip(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function gunzip(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

async function readRemote(uid: string): Promise<AppData | null> {
  const snap = await getDoc(doc(firebase().db, "users", uid));
  const bytes = snap.exists() ? (snap.get("data") as Bytes | undefined) : undefined;
  if (!bytes) return null;
  const text = await gunzip(bytes.toUint8Array());
  return text.trim() ? parseImport(text) : null;
}

async function writeRemote(uid: string, data: AppData) {
  const bytes = await gzip(serializeExport(data, new Date()));
  await setDoc(doc(firebase().db, "users", uid), { data: Bytes.fromUint8Array(bytes), updatedAt: serverTimestamp() });
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { data, ready, mergeData } = useStore();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string>();
  const [status, setStatus] = useState<AccountStatus>("loading");
  const [lastSynced, setLastSynced] = useState<Date>();
  const [error, setError] = useState<string>();
  const dataRef = useRef(data);
  const synced = useRef<string>(""); // JSON of the data as last agreed with the cloud
  const pulled = useRef(false); // never push before the first pull, or a fresh device could overwrite the cloud copy
  const busy = useRef<Promise<void> | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  /** Read the cloud copy, merge it in, and write back if this device had anything new. */
  const sync = useCallback(
    (id: string) => {
      const run = async () => {
        try {
          const remote = await readRemote(id);
          const merged = remote ? mergeAppData(dataRef.current, remote) : dataRef.current;
          const json = JSON.stringify(merged);
          if (!remote || json !== JSON.stringify(remote)) await writeRemote(id, merged);
          if (remote) mergeData(remote);
          synced.current = json;
          pulled.current = true;
          setLastSynced(new Date());
          setError(undefined);
          setStatus("on");
        } catch (e) {
          setStatus("error");
          setError(message(e, "Couldn't save to your account."));
        }
      };
      // One sync at a time; a request made meanwhile runs right after.
      const next = (busy.current ?? Promise.resolve()).then(run);
      busy.current = next;
      return next;
    },
    [mergeData],
  );

  // Follow the sign-in state (Firebase remembers it between visits).
  useEffect(() => {
    if (!ready) return;
    return onAuthStateChanged(firebase().auth, (user) => {
      pulled.current = false;
      setUid(user?.uid ?? null);
      setEmail(user?.email ?? undefined);
      if (user) {
        setStatus("syncing");
        void sync(user.uid);
      } else {
        setStatus("signed-out");
        setLastSynced(undefined);
      }
    });
  }, [ready, sync]);

  // Pick up the other device's progress when coming back to the app, and every few minutes.
  useEffect(() => {
    if (!uid) return;
    const onVisible = () => document.visibilityState === "visible" && void sync(uid);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = setInterval(() => document.visibilityState === "visible" && void sync(uid), 3 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(timer);
    };
  }, [uid, sync]);

  // Push shortly after local changes.
  useEffect(() => {
    if (!uid || !pulled.current || status !== "on") return;
    if (JSON.stringify(data) === synced.current) return;
    const t = setTimeout(() => void sync(uid), 2500);
    return () => clearTimeout(t);
  }, [data, uid, status, sync]);

  const signIn = useCallback(async (mail: string, password: string) => {
    setError(undefined);
    try {
      await signInWithEmailAndPassword(firebase().auth, mail.trim(), password);
    } catch (e) {
      setError(message(e, "Couldn't sign in."));
    }
  }, []);

  const signUp = useCallback(async (mail: string, password: string) => {
    setError(undefined);
    try {
      await createUserWithEmailAndPassword(firebase().auth, mail.trim(), password);
    } catch (e) {
      setError(message(e, "Couldn't create the account."));
    }
  }, []);

  const resetPassword = useCallback(async (mail: string) => {
    setError(undefined);
    try {
      await sendPasswordResetEmail(firebase().auth, mail.trim());
      return "If that email has an account, a reset link is on its way.";
    } catch (e) {
      setError(message(e, "Couldn't send the reset email."));
      return "";
    }
  }, []);

  const signOut = useCallback(async () => {
    // Save once more so nothing from this device is lost, then sign out. Local progress stays on this device.
    if (uid && pulled.current) await sync(uid);
    await fbSignOut(firebase().auth);
  }, [uid, sync]);

  const syncNow = useCallback(async () => {
    if (uid) await sync(uid);
  }, [uid, sync]);

  return (
    <Ctx.Provider value={{ status, email, lastSynced, error, signIn, signUp, resetPassword, signOut, syncNow }}>{children}</Ctx.Provider>
  );
}

export function useAccount(): Account {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAccount must be used inside AccountProvider");
  return c;
}
