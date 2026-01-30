import { useReactFlow, ReactFlowState, useStore } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Group } from 'lucide-react';
import { NodeType } from '@/config/node-components';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const selectNodes = (state: ReactFlowState) => state.nodes.filter((n) => n.selected);

export function GroupButton() {
    const { getNodes, setNodes } = useReactFlow();
    // We can use the store to reactively get selected nodes if we want to disable the button
    // But for simplicity, we'll just check on click for now or use a hook if dynamic disabling is needed.
    // Using useStore to make it reactive for disabling would be better UX.
    const selectedNodesLength = useStore((state) => state.nodes.filter(n => n.selected && n.type !== NodeType.GROUP).length);

    const handleGroup = () => {
        const nodes = getNodes();
        const selectedNodes = nodes.filter((n) => n.selected && n.type !== NodeType.GROUP);

        if (selectedNodes.length < 2) {
            toast.error('Select at least 2 nodes to group');
            return;
        }

        // Calculate bounding box
        const minX = Math.min(...selectedNodes.map((n) => n.position.x));
        const minY = Math.min(...selectedNodes.map((n) => n.position.y));
        const maxX = Math.max(...selectedNodes.map((n) => n.position.x + (n.measured?.width || 0)));
        const maxY = Math.max(...selectedNodes.map((n) => n.position.y + (n.measured?.height || 0)));

        const padding = 40;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        const groupId = uuidv4();
        const groupNode = {
            id: groupId,
            type: NodeType.GROUP,
            position: { x: minX - padding, y: minY - padding },
            data: { label: 'Group' },
            style: { width, height },
        };

        const updatedNodes = nodes.map((n) => {
            // If node is selected, make it a child of the group
            if (n.selected && n.type !== NodeType.GROUP) {
                return {
                    ...n,
                    parentId: groupId,
                    extent: 'parent' as const,
                    position: {
                        x: n.position.x - (minX - padding),
                        y: n.position.y - (minY - padding),
                    },
                    selected: false, // Deselect children
                };
            }
            return n;
        });

        setNodes([groupNode, ...updatedNodes]);
        toast.success('Nodes grouped');
    };

    return (
        <Button
            variant="outline"
            size="icon"
            className="gap-2 shadow-md size-10"
            onClick={handleGroup}
            disabled={selectedNodesLength < 2}
        >
            <Group className="w-4 h-4" />
        </Button>
    );
}
