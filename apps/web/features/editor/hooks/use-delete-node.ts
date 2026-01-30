import { useSetAtom } from 'jotai';
import { deleteNodeAtom } from '../store';

export function useDeleteNode() {
    const deleteNode = useSetAtom(deleteNodeAtom);

    const handleDeleteNode = (nodeId: string) => {
        deleteNode(nodeId);
    };

    return handleDeleteNode;
}
