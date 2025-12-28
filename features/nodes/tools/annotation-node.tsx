"use client"

import { NodeResizer } from '@xyflow/react';
import { memo, useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { updateNodeAtom } from '@/features/editor/store';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaintBucket, MoreHorizontal } from 'lucide-react';

const COLORS = {
    yellow: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        border: 'border-yellow-300 dark:border-yellow-700',
        text: 'text-yellow-900 dark:text-yellow-100',
        label: 'text-yellow-600 dark:text-yellow-500',
        input: 'text-yellow-900/80 dark:text-yellow-100/80 placeholder:text-yellow-900/40 dark:placeholder:text-yellow-100/40'
    },
    blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        border: 'border-blue-300 dark:border-blue-700',
        text: 'text-blue-900 dark:text-blue-100',
        label: 'text-blue-600 dark:text-blue-500',
        input: 'text-blue-900/80 dark:text-blue-100/80 placeholder:text-blue-900/40 dark:placeholder:text-blue-100/40'
    },
    green: {
        bg: 'bg-green-100 dark:bg-green-900/20',
        border: 'border-green-300 dark:border-green-700',
        text: 'text-green-900 dark:text-green-100',
        label: 'text-green-600 dark:text-green-500',
        input: 'text-green-900/80 dark:text-green-100/80 placeholder:text-green-900/40 dark:placeholder:text-green-100/40'
    },
    red: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        border: 'border-red-300 dark:border-red-700',
        text: 'text-red-900 dark:text-red-100',
        label: 'text-red-600 dark:text-red-500',
        input: 'text-red-900/80 dark:text-red-100/80 placeholder:text-red-900/40 dark:placeholder:text-red-100/40'
    },
    purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/20',
        border: 'border-purple-300 dark:border-purple-700',
        text: 'text-purple-900 dark:text-purple-100',
        label: 'text-purple-600 dark:text-purple-500',
        input: 'text-purple-900/80 dark:text-purple-100/80 placeholder:text-purple-900/40 dark:placeholder:text-purple-100/40'
    },
    gray: {
        bg: 'bg-zinc-100 dark:bg-zinc-900/20',
        border: 'border-zinc-300 dark:border-zinc-700',
        text: 'text-zinc-900 dark:text-zinc-100',
        label: 'text-zinc-600 dark:text-zinc-500',
        input: 'text-zinc-900/80 dark:text-zinc-100/80 placeholder:text-zinc-900/40 dark:placeholder:text-zinc-100/40'
    }
};

type ColorKey = keyof typeof COLORS;

const AnnotationNode = ({ selected, data, id, style }: { selected?: boolean, data: { label?: string, color?: ColorKey }, id: string, style?: React.CSSProperties }) => {
    const updateNode = useSetAtom(updateNodeAtom);
    const colorKey = data.color || 'yellow';
    const theme = COLORS[colorKey] || COLORS.yellow;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateNode({
            id,
            updates: {
                data: {
                    ...data,
                    label: e.target.value,
                },
            },
        });
    }, [id, updateNode, data]);

    const handleColorChange = useCallback((newColor: ColorKey) => {
        updateNode({
            id,
            updates: {
                data: {
                    ...data,
                    color: newColor,
                },
            },
        });
    }, [id, updateNode, data]);

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={200}
                minHeight={100}
                lineStyle={{ border: '1px solid var(--ring)', opacity: 0.5 }}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
            />
            <div
                style={style}
                className={cn(
                    "rounded-xl border shadow-sm flex flex-col transition-all duration-200 w-full h-full",
                    theme.bg,
                    theme.border,
                    selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:shadow-md"
                )}
            >
                <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/5">
                    <div className={cn("text-[10px] uppercase font-bold tracking-widest select-none flex items-center gap-2", theme.label)}>
                        Note
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn("p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100", selected && "opacity-100", theme.text)}>
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            {(Object.keys(COLORS) as ColorKey[]).map((color) => (
                                <DropdownMenuItem
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    className="gap-2 capitalize"
                                >
                                    <div className={cn("w-3 h-3 rounded-full border", {
                                        'bg-yellow-400 border-yellow-600': color === 'yellow',
                                        'bg-blue-400 border-blue-600': color === 'blue',
                                        'bg-green-400 border-green-600': color === 'green',
                                        'bg-red-400 border-red-600': color === 'red',
                                        'bg-purple-400 border-purple-600': color === 'purple',
                                        'bg-zinc-400 border-zinc-600': color === 'gray',
                                    })} />
                                    {color}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex-1 p-3 min-h-0 flex flex-col">
                    <textarea
                        className={cn("w-full h-full bg-transparent resize-none outline-none text-sm font-medium leading-relaxed min-h-[60px]", theme.input)}
                        value={data.label || ''}
                        onChange={handleChange}
                        placeholder="Type your note here..."
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        </>
    );
};

export default memo(AnnotationNode);
