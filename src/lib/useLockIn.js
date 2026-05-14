import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";

const LockInContext = createContext(null);

function normaliseTasks(taskLabels) {
  return taskLabels
    .map((label, index) => ({
      id: `${Date.now()}-${index}`,
      label: String(label || "").trim(),
      completed: false
    }))
    .filter((task) => task.label);
}

export function LockInProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [pendingConfig, setPendingConfig] = useState(null);
  const [pendingMessage, setPendingMessage] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [session, setSession] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const sessionIdRef = useRef(null);
  const tasksRef = useRef([]);
  const isPausedRef = useRef(false);
  const endingRef = useRef(false);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => () => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!completionMessage) return undefined;
    const timer = window.setTimeout(() => setCompletionMessage(""), 4200);
    return () => window.clearTimeout(timer);
  }, [completionMessage]);

  useEffect(() => {
    if (!isActive || tasks.length === 0 || !tasks.every((task) => task.completed)) return undefined;
    const timer = window.setTimeout(() => endSession("completed"), 800);
    return () => window.clearTimeout(timer);
  }, [isActive, tasks]);

  async function createSessionRecord(config, preparedTasks) {
    if (!supabase) return null;
    const { data: authData } = await supabase.auth.getSession();
    const userId = authData?.session?.user?.id;
    const { data } = await supabase
      .from("lockin_sessions")
      .insert({
        user_id: userId || null,
        duration_hours: config.durationHours,
        tasks: preparedTasks,
        scheduled_for: config.scheduledFor || null,
        tasks_total: preparedTasks.length,
        tasks_completed: 0,
        status: "active"
      })
      .select("id")
      .single();
    return data?.id || null;
  }

  async function startActiveSession(config, existingTasks = null, existingSessionId = null) {
    window.clearInterval(intervalRef.current);
    endingRef.current = false;
    const preparedTasks = existingTasks || normaliseTasks(config.tasks || []);
    const totalSeconds = Math.round(Number(config.durationHours || 0) * 3600);

    setIsPending(false);
    setPendingConfig(null);
    setPendingMessage("");
    setSession(config);
    setTasks(preparedTasks);
    setSecondsLeft(totalSeconds);
    setIsPaused(false);
    setIsActive(true);

    if (existingSessionId) {
      setSessionId(existingSessionId);
      sessionIdRef.current = existingSessionId;
    } else {
      createSessionRecord(config, preparedTasks).then((id) => {
        if (!id) return;
        setSessionId(id);
        sessionIdRef.current = id;
      });
    }

    intervalRef.current = window.setInterval(() => {
      if (isPausedRef.current) return;
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(intervalRef.current);
          endSession("completed");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function startSession(config) {
    const preparedTasks = normaliseTasks(config.tasks || []);
    if (preparedTasks.length === 0) return;

    window.clearTimeout(timeoutRef.current);
    window.clearInterval(intervalRef.current);

    if (config.scheduledFor) {
      const scheduled = new Date(config.scheduledFor);
      const delayMs = scheduled.getTime() - Date.now();
      const scheduledTime = scheduled.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const createdId = await createSessionRecord(config, preparedTasks);

      if (delayMs > 0) {
        setIsActive(false);
        setIsPending(true);
        setPendingConfig(config);
        setPendingMessage(`Lock-in scheduled for ${scheduledTime}`);
        setSessionId(createdId);
        sessionIdRef.current = createdId;
        tasksRef.current = preparedTasks;
        timeoutRef.current = window.setTimeout(() => {
          startActiveSession(config, preparedTasks, createdId);
        }, delayMs);
        return;
      }

      startActiveSession(config, preparedTasks, createdId);
      return;
    }

    startActiveSession(config, preparedTasks);
  }

  function completeTask(taskId) {
    setTasks((current) => current.map((task) => (
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )));
  }

  function togglePause() {
    if (!isActive) return;
    setIsPaused((current) => !current);
  }

  async function persistSessionEnd(status, finalTasks) {
    const id = sessionIdRef.current;
    if (!supabase || !id) return;
    const completedCount = finalTasks.filter((task) => task.completed).length;
    await supabase
      .from("lockin_sessions")
      .update({
        completed_at: new Date().toISOString(),
        tasks: finalTasks,
        tasks_completed: completedCount,
        status
      })
      .eq("id", id);
  }

  function endSession(status = "abandoned") {
    if (endingRef.current) return;
    endingRef.current = true;
    const finalTasks = tasksRef.current;
    const completedCount = finalTasks.filter((task) => task.completed).length;

    window.clearInterval(intervalRef.current);
    window.clearTimeout(timeoutRef.current);
    persistSessionEnd(status, finalTasks).catch(() => {});

    if (status === "completed") {
      setCompletionMessage(`Session complete — ${completedCount} of ${finalTasks.length} tasks done`);
    }

    setIsActive(false);
    setIsPending(false);
    setPendingConfig(null);
    setPendingMessage("");
    setSession(null);
    setSecondsLeft(0);
    setTasks([]);
    setIsPaused(false);
    setSessionId(null);
    sessionIdRef.current = null;
    window.setTimeout(() => {
      endingRef.current = false;
    }, 0);
  }

  function cancelPending() {
    if (!isPending) return;
    endSession("abandoned");
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const remainingCount = tasks.length - completedCount;
  const totalSeconds = Math.max(0, Math.round(Number(session?.durationHours || 0) * 3600));
  const perTaskSeconds = tasks.length > 0 ? Math.max(1, Math.round(totalSeconds / tasks.length)) : totalSeconds;
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const timeBasedTaskIndex = tasks.length > 0 ? Math.min(tasks.length - 1, Math.floor(elapsedSeconds / perTaskSeconds)) : 0;
  const firstIncompleteIndex = tasks.findIndex((task) => !task.completed);
  const currentTaskIndex = firstIncompleteIndex >= 0 ? Math.max(firstIncompleteIndex, timeBasedTaskIndex) : tasks.length - 1;
  const currentTask = tasks[currentTaskIndex] || null;
  const taskSecondsLeft = tasks.length > 0 && secondsLeft > 0
    ? Math.max(0, Math.ceil(perTaskSeconds - (elapsedSeconds % perTaskSeconds)))
    : secondsLeft;

  const value = useMemo(() => ({
    isActive,
    isPending,
    isPaused,
    pendingConfig,
    pendingMessage,
    completionMessage,
    session,
    secondsLeft,
    totalSeconds,
    currentTask,
    currentTaskIndex,
    taskSecondsLeft,
    tasks,
    completedCount,
    remainingCount,
    startSession,
    completeTask,
    togglePause,
    endSession,
    cancelPending
  }), [completedCount, completionMessage, currentTask, currentTaskIndex, isActive, isPaused, isPending, pendingConfig, pendingMessage, remainingCount, secondsLeft, session, taskSecondsLeft, tasks, totalSeconds]);

  return React.createElement(LockInContext.Provider, { value }, children);
}

export function useLockIn() {
  const context = useContext(LockInContext);
  if (!context) {
    throw new Error("useLockIn must be used inside LockInProvider");
  }
  return context;
}
