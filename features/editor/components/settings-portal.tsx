'use client';

import { createPortal } from 'react-dom';
import { useAtomValue } from 'jotai';
import { activeSettingsNodeIdAtom } from '../store';
import { useSettingsPortal } from './settings-context';

interface SettingsPortalProps {
    nodeId: string;
    children: React.ReactNode;
}

export const SettingsPortal = ({ nodeId, children }: SettingsPortalProps) => {
    const activeNodeId = useAtomValue(activeSettingsNodeIdAtom);
    const portalContainer = useSettingsPortal();

    if (!portalContainer || activeNodeId !== nodeId) return null;

    return createPortal(children, portalContainer);
};
