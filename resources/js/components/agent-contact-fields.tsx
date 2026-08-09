import { LabeledField } from '@/components/edit-panel/fields';
import { SearchableCombobox } from '@/components/searchable-combobox';
import { Label } from '@/components/ui/label';
import type { AgentOption, AgentPicOption } from '@/types';

export interface AgentContactValues {
    agent_id: string;
    agent_pic_id: string;
    mobile_no: string;
}

/** Agency → PIC → contact number, shared by the sales and operations order dialogs. */
export function AgentContactFields({
    agents,
    agentPics,
    values,
    onChange,
}: {
    agents: AgentOption[];
    agentPics: AgentPicOption[];
    values: AgentContactValues;
    onChange: (patch: Partial<AgentContactValues>) => void;
}) {
    const pics = agentPics.filter(
        (pic) => String(pic.agent_id) === values.agent_id,
    );

    return (
        <>
            <div className="grid gap-1">
                <Label>Agency</Label>
                <SearchableCombobox
                    items={[
                        {
                            value: '',
                            label: 'No agency',
                            sublabel: 'Unassigned',
                        },
                        ...agents.map((agent) => ({
                            value: String(agent.id),
                            label: agent.name,
                            sublabel: agent.address ?? '',
                        })),
                    ]}
                    value={values.agent_id}
                    onChange={(value) =>
                        onChange({
                            agent_id: value,
                            agent_pic_id: '',
                            mobile_no: '',
                        })
                    }
                    placeholder="Select agency"
                    searchPlaceholder="Search agency"
                    emptyText="No agencies available."
                />
            </div>

            <div className="grid gap-1">
                <Label>PIC</Label>
                <SearchableCombobox
                    items={pics.map((pic) => ({
                        value: String(pic.id),
                        label: pic.name,
                        sublabel: pic.mobile,
                    }))}
                    value={values.agent_pic_id}
                    onChange={(value) =>
                        onChange({
                            agent_pic_id: value,
                            mobile_no:
                                pics.find((pic) => String(pic.id) === value)
                                    ?.mobile ?? '',
                        })
                    }
                    placeholder={
                        values.agent_id
                            ? 'Select PIC'
                            : 'Select an agency first'
                    }
                    searchPlaceholder="Search PIC"
                    emptyText={
                        values.agent_id
                            ? 'No PICs for this agency.'
                            : 'Select an agency first.'
                    }
                />
            </div>

            <LabeledField
                id="agent-contact-no"
                label="Contact No"
                value={values.mobile_no}
                onChange={(value) => onChange({ mobile_no: value })}
            />
        </>
    );
}
