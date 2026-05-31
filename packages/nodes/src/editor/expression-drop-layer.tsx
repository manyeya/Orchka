"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@orchka/ui/utils";

import { EXPRESSION_DRAG_MIME, type ExpressionDragPayload } from "./advanced-data-viewer";

interface ExpressionDropLayerProps {
    children: ReactNode;
    className?: string;
}

/**
 * Wraps a region (typically the settings form) and turns any input or
 * textarea inside it into a drop target for expressions dragged from the
 * input-data tree. On drop we locate the field under the cursor and insert
 * the generated {{ $node(...) }} expression at the caret position, using
 * the native value setter so React's onChange (and react-hook-form) fires.
 */
export const ExpressionDropLayer = ({ children, className }: ExpressionDropLayerProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const layerRef = useRef<HTMLDivElement | null>(null);

    // Track when an expression drag starts so we can surface drop affordances
    // even before the cursor enters the layer.
    useEffect(() => {
        const onStart = () => setIsDragging(true);
        const onEnd = () => setIsDragging(false);
        window.addEventListener("orchka-expression-drag-start", onStart);
        window.addEventListener("orchka-expression-drag-end", onEnd);
        return () => {
            window.removeEventListener("orchka-expression-drag-start", onStart);
            window.removeEventListener("orchka-expression-drag-end", onEnd);
        };
    }, []);

    return (
        <div
            ref={layerRef}
            data-expression-drop-layer
            className={cn(
                "relative h-full",
                isDragging && "expression-drop-active",
                className,
            )}
            onDragOver={(e) => {
                if (!e.dataTransfer.types.includes(EXPRESSION_DRAG_MIME)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(e) => {
                const raw = e.dataTransfer.getData(EXPRESSION_DRAG_MIME);
                if (!raw) return;
                e.preventDefault();
                setIsDragging(false);

                let payload: ExpressionDragPayload;
                try {
                    payload = JSON.parse(raw) as ExpressionDragPayload;
                } catch {
                    return;
                }

                const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
                const field = target?.closest("input, textarea") as
                    | HTMLInputElement
                    | HTMLTextAreaElement
                    | null;
                if (!field) return;

                // Skip fields that can't reasonably hold an expression string.
                if (field instanceof HTMLInputElement) {
                    const type = field.type.toLowerCase();
                    if (
                        type === "checkbox" ||
                        type === "radio" ||
                        type === "color" ||
                        type === "file" ||
                        type === "range"
                    ) {
                        return;
                    }
                }

                const expression = payload.fieldPath
                    ? `{{ $node("${payload.nodeName}").${payload.fieldPath} }}`
                    : `{{ $node("${payload.nodeName}") }}`;

                insertAtCursor(field, expression);
            }}
        >
            {children}
            <style>{`
                .expression-drop-active input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]):not([type="color"]),
                .expression-drop-active textarea {
                    box-shadow: 0 0 0 1px var(--primary), 0 0 12px -4px color-mix(in oklab, var(--primary), transparent 60%);
                    transition: box-shadow 120ms ease;
                }
            `}</style>
        </div>
    );
};

function insertAtCursor(
    field: HTMLInputElement | HTMLTextAreaElement,
    text: string,
) {
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;
    const before = field.value.slice(0, start);
    const after = field.value.slice(end);
    const next = before + text + after;

    // React tracks the previous value on the input via a tagged setter, so a
    // plain `field.value =` won't trigger onChange. Call the prototype's
    // native setter, then dispatch a bubbling input event so React (and
    // react-hook-form) picks the change up exactly like a keystroke.
    const proto =
        field instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (nativeSetter) {
        nativeSetter.call(field, next);
    } else {
        field.value = next;
    }
    field.dispatchEvent(new Event("input", { bubbles: true }));

    const caret = start + text.length;
    try {
        field.setSelectionRange(caret, caret);
    } catch {
        // Some input types (email, number) don't support selection ranges; ignore.
    }
    field.focus();
}
