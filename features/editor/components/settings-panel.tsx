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

    return (
        <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={20} maxSize={60} className="bg-background border-l">
                <div className="h-full flex flex-col ">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold">Settings</h3>
                        <Button
                            variant="ghost"
                            size="icon" 
                            onClick={() => setActiveNodeId(null)}
                            className="h-8 w-8"
                        >
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div ref={setContainer} />
                    </div>
                </div>
            </ResizablePanel>
        </>
    );
};
