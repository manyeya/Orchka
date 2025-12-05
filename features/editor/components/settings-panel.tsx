'use client';

import { useAtom } from 'jotai';
import { activeSettingsNodeIdAtom } from '../store';
import { ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
    setContainer: (element: HTMLElement | null) => void;
}

export const SettingsPanel = ({ setContainer }: SettingsPanelProps) => {
    const [activeNodeId, setActiveNodeId] = useAtom(activeSettingsNodeIdAtom);
    if (!activeNodeId) return null;
    if (!setContainer) return null;

    const handleCancel = () => {
        setActiveNodeId(null);
    }

    return (
        <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={20} maxSize={50} className="bg-background border-l overflow-y-auto h-full">
                <div ref={setContainer} className="h-full relative">
                    <Button variant="ghost" onClick={handleCancel} className="absolute top-2 right-2 cursor-pointer">
                        <XIcon className="h-4 w-4" />
                    </Button>
                </div>
            </ResizablePanel>
        </>
    );
};
