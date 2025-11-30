'use client';

import { createContext, useContext } from 'react';

export const SettingsPortalContext = createContext<HTMLElement | null>(null);

export const useSettingsPortal = () => useContext(SettingsPortalContext);
