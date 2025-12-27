"use client"
import { NodeResizer } from '@xyflow/react';
import { memo } from 'react';

const GroupNode = ({ selected }: { selected?: boolean }) => {
    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={100}
                minHeight={100}
                lineStyle={{ border: '1px solid var(--primary)' }}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
            />
            <div className="w-full h-full bg-primary/5 rounded-xl border-2 border-primary/20 p-4 min-w-[100px] min-h-[100px]">
                <div className="text-xs uppercase font-bold text-primary tracking-widest opacity-50 select-none">
                    Group
                </div>
            </div>
        </>
    );
};

export default memo(GroupNode);
