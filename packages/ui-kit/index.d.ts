import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactElement, ReactNode } from "react";
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }): ReactElement;
export function Card(props: HTMLAttributes<HTMLElement>): ReactElement;
export function Field(props: { label: string; hint?: string; children: ReactNode }): ReactElement;
export function TextInput(props: InputHTMLAttributes<HTMLInputElement>): ReactElement;
export function Modal(props: { open: boolean; title: string; onClose?: () => void; children: ReactNode }): ReactElement | null;
export function Tabs(props: { items: Array<{ value: string; label: string }>; active: string; onChange: (value: string) => void; label?: string }): ReactElement;
export function DataTable<T>(props: { columns: Array<{ key: string; label: string; render?: (row: T) => ReactNode }>; rows: T[]; getRowKey?: (row: T, index: number) => string | number }): ReactElement;
