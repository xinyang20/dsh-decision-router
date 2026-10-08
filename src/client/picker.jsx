import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MenuSurface } from '@deepseek-ai/dsh-client-ui-primitives';

// Reuse DSH's menu surface and design tokens, with a searchable list for model catalogs.
export function Picker({ label, value, options, onChange, disabled, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState(null);
  const trigger = useRef(null);
  const panel = useRef(null);
  const search = useRef(null);
  const id = useId();
  const selected = options.find(option => option.value === value);
  const filtered = options.filter(option => `${option.label} ${option.description ?? ''} ${option.searchText ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  function close(focus = true) { setOpen(false); if (focus) trigger.current?.focus(); }
  function choose(option) { if (option.disabled) return; onChange(option.value); close(); }
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const menu = panel.current;
      if (!menu || !trigger.current) return;
      const box = trigger.current.getBoundingClientRect();
      // Measure the actual labels and descriptions, independently of the
      // trigger's layout width. Long descriptions wrap at the menu's cap.
      menu.style.width = 'max-content';
      const width = Math.ceil(menu.getBoundingClientRect().width);
      menu.style.width = `${width}px`;
      const height = menu.getBoundingClientRect().height;
      const below = window.innerHeight - box.bottom - 12;
      const top = below >= height || below >= box.top - 12 ? box.bottom + 4 : box.top - height - 4;
      const next = { width, left: Math.max(12, Math.min(box.left, window.innerWidth - width - 12)), top: Math.max(12, Math.min(top, window.innerHeight - height - 12)) };
      setPosition(previous => previous && Object.keys(next).every(key => previous[key] === next[key]) ? previous : next);
    };
    place();
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, query, options, searchable]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) close(false); };
    document.addEventListener('pointerdown', outside);
    (search.current ?? panel.current?.querySelector('[aria-selected="true"]:not(:disabled)') ?? panel.current?.querySelector('[role="option"]:not(:disabled)'))?.focus();
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  function keys(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === 'Tab') { close(false); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    // Home/End in the search field keep their normal text editing behavior.
    if (event.target === search.current && ['Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const rows = [...panel.current.querySelectorAll('[role="option"]:not(:disabled)')];
    const index = rows.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
    rows[next]?.focus();
  }
  return <span className="dar-picker">
    <button ref={trigger} type="button" className="dar-picker-trigger" aria-label={label} aria-description={`当前：${selected?.label ?? value ?? '未选择'}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined} disabled={disabled} title={selected?.label ?? value} onClick={() => { setQuery(''); setOpen(!open); }} onKeyDown={event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setQuery(''); setOpen(true); } }}><span>{selected?.label ?? value ?? '请选择'}</span><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={open ? 'is-open' : ''}><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
    {open && createPortal(<MenuSurface ref={panel} className="dar-picker-menu" style={{ boxSizing: 'border-box', width: 'max-content', minWidth: searchable ? 'min(20ch, calc(100vw - 24px))' : 0, maxWidth: 'min(440px, calc(100vw - 24px))', ...(position ?? { visibility: 'hidden' }) }} onKeyDown={keys}>
      {searchable && <div className="dar-picker-search"><svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" /></svg><input ref={search} aria-label={`搜索${label}`} placeholder="搜索模型或名称…" value={query} onChange={event => setQuery(event.target.value)} /></div>}
      <div className="dar-picker-options" id={`${id}-list`} role="listbox" aria-label={label}>{filtered.map(option => <button type="button" role="option" aria-selected={option.value === value} disabled={option.disabled} key={option.value} onClick={() => choose(option)}><span className="dar-picker-copy"><span>{option.label}</span>{option.description && <small>{option.description}</small>}</span><span className="dar-picker-check">{option.value === value && <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span></button>)}{!filtered.length && <p className="dar-picker-empty">没有匹配的选项</p>}</div>
    </MenuSurface>, trigger.current?.closest('[role="dialog"]') ?? document.body)}
  </span>;
}
