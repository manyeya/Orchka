"use client"

import { NodeResizer } from '@xyflow/react';
import { memo, useState } from 'react';

const AnnotationNode = ({ selected, data }: { selected?: boolean, data: { label?: string } }) => {
    // Local state for immediate feedback, though ideally this should sync to flow state if persistent
    const [text, setText] = useState(data.label || 'Write a note...');

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={150}
                minHeight={100}
                lineStyle={{ border: '1px solid var(--accent-foreground)' }}
            />
            <div className="w-full h-full bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700 shadow-sm flex flex-col p-2 min-w-[150px] min-h-[100px]">
                <div className="text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-500 mb-1 select-none">
                    Note
                </div>
                <textarea
                    className="w-full h-full bg-transparent resize-none outline-none text-sm text-foreground/80 font-medium"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your note here..."
                    onPointerDown={(e) => e.stopPropagation()} // Allow typing without dragging
                />
            </div>
        </>
    );
};

export default memo(AnnotationNode);
