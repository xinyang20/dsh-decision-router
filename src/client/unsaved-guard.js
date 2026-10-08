import { useCallback, useEffect, useRef, useState } from 'react';

const SETTINGS_PANEL = '[role="dialog"][data-shortcut-modal="settings"]';
const MODAL_LAYERS = '[role="dialog"][aria-modal="true"], [role="menu"]';
const shortcutSources = new WeakMap();

// Read the public, effective catalog at key time so user-rebound shortcuts and
// conflict/unbound states take effect without copying DSH's default bindings.
export function installUnsavedGuardShortcuts(ctx) {
  ctx.effect(() => {
    const source = ctx.shortcuts.catalog;
    shortcutSources.set(document, source);
    return () => { if (shortcutSources.get(document) === source) shortcutSources.delete(document); };
  });
}

function isSettingsShortcut(event, document) {
  const row = shortcutSources.get(document)?.getSnapshot().find(item => item.id === 'settings.open');
  const binding = row?.binding;
  // Web bindings have one physical key. An undefined aria value also marks a
  // loading or disabled binding in the host's effective catalog.
  if (!binding || binding.secondCode !== undefined || !row.aria || row.issue != null || row.conflicts?.length) return false;
  const modifiers = new Set(binding.modifiers);
  return event.code === binding.code &&
    modifiers.has('control') === event.ctrlKey && modifiers.has('alt') === event.altKey &&
    modifiers.has('shift') === event.shiftKey && modifiers.has('meta') === event.metaKey;
}

// The current DSH settings section contract provides close(), but no before-close
// callback. Keep this compatibility boundary on the mounted settings overlay;
// never capture unrelated page clicks or change the host's private React state.
export function useUnsavedGuard({ dirty, busy = false, onSave, onClose }) {
  const [root, rootRef] = useState(null);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const current = useRef({ dirty, busy, onSave, onClose });
  current.current = { dirty, busy, onSave, onClose };
  const action = useRef(null);
  const bypass = useRef(false);
  const savingNow = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; action.current = null; };
  }, []);

  useEffect(() => {
    const panel = root?.closest(SETTINGS_PANEL);
    const overlay = panel?.parentElement;
    if (!panel || !overlay) return;

    // DSH 0.2's shell owns a nav followed by its content column. The close
    // button is the header's direct button; settings.action has its own child
    // container. No translated text or generated CSS class is used here.
    const navigation = panel.querySelector(':scope > nav');
    const header = navigation?.nextElementSibling?.firstElementChild;
    const closeButton = header?.querySelector(':scope > button');
    const mask = [...overlay.children].find(element => element !== panel && element.getAttribute('aria-hidden') === 'true');

    const ask = (event, proceed) => {
      if (bypass.current || (!current.current.dirty && !action.current)) return;
      event.preventDefault();
      event.stopPropagation();
      if (action.current) return;
      action.current = proceed;
      setError('');
      setPending(true);
    };
    const close = () => {
      if (current.current.onClose) current.current.onClose();
      else closeButton?.click();
    };
    const click = event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target === mask || closeButton?.contains(target)) {
        ask(event, close);
        return;
      }
      const button = target.closest('button');
      if (button && navigation?.contains(button) && button.getAttribute('aria-current') !== 'true') {
        ask(event, () => { if (button.isConnected) button.click(); });
      }
    };
    const keydown = event => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.keyCode === 229 || event.key === 'Dead' || event.getModifierState?.('AltGraph')) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[role="dialog"][aria-modal="true"]') !== panel) return;
      if (isSettingsShortcut(event, panel.ownerDocument)) {
        // The settings command toggles the current top modal. Respect the same
        // modal ownership check before intercepting its real configured key.
        if ([...panel.ownerDocument.querySelectorAll(MODAL_LAYERS)].at(-1) === panel) ask(event, close);
        return;
      }
      if (event.key !== 'Escape' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      // A model picker or a nested confirmation owns its Escape first.
      if (target?.closest('[role="menu"], [role="listbox"], [data-menu-material]')) return;
      ask(event, close);
    };

    // DSH's configurable Web shortcuts dispatch at window bubble, and its
    // modal Escape handler runs at document bubble. Overlay capture precedes
    // both, without observing unrelated document keyboard input.
    overlay.addEventListener('click', click, true);
    overlay.addEventListener('keydown', keydown, true);
    return () => {
      overlay.removeEventListener('click', click, true);
      overlay.removeEventListener('keydown', keydown, true);
    };
  }, [root]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const continueEditing = useCallback(() => {
    if (savingNow.current || current.current.busy) return;
    action.current = null;
    setPending(false);
    setError('');
  }, []);

  const proceed = useCallback(() => {
    const next = action.current;
    if (!next) return;
    action.current = null;
    setPending(false);
    setError('');
    bypass.current = true;
    try { next(); } finally { bypass.current = false; }
  }, []);

  const discard = useCallback(() => {
    if (!savingNow.current && !current.current.busy) proceed();
  }, [proceed]);

  const saveAndClose = useCallback(async () => {
    if (!action.current || savingNow.current || current.current.busy) return false;
    if (!current.current.dirty) { proceed(); return true; }
    savingNow.current = true;
    setSaving(true);
    setError('');
    try {
      const saved = await current.current.onSave();
      if (!mounted.current) return false;
      if (saved !== true) {
        setError('模型配置尚未保存，请检查设置中的提示后重试。');
        return false;
      }
      proceed();
      return true;
    } catch (failure) {
      if (mounted.current) setError(failure?.message || '保存失败，请重试。');
      return false;
    } finally {
      savingNow.current = false;
      if (mounted.current) setSaving(false);
    }
  }, [proceed]);

  return { rootRef, pending, saving, error, continueEditing, discard, saveAndClose };
}
