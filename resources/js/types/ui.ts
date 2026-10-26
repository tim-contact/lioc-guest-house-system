import type { ReactNode } from 'react';

export type AppLayoutProps = {
    children: ReactNode;
    title?: string;
};

export type FlashToast = {
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};

/** A backed-enum case as sent by Controller::enumOptions(). */
export type EnumOption = {
    value: string;
    label: string;
};

/** A real supply location, scoped to a port. */
export type SupplyLocationOption = EnumOption & {
    port_id: number;
    location_type: string;
};

/** An agency, as sent to every page with an agent dropdown. */
export type AgentOption = {
    id: number;
    name: string;
    address?: string | null;
};

/** One of an agency's PICs; the mobile prefills the order's contact field. */
export type AgentPicOption = {
    id: number;
    agent_id: number;
    name: string;
    mobile: string;
    contact_numbers?: string[];
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};
