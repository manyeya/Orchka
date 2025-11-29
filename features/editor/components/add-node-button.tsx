'use client'

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { memo, useState } from "react";
import { NodeSelector } from "./node-selector";

export const AddNodeButton = memo(() => {
    const [open, setOpen] = useState(false)
    return (
        <NodeSelector open={open} onOpenChange={setOpen}>
            <Button className="bg-background" variant="outline">
                <PlusIcon className="size-4" />
            </Button>
        </NodeSelector>
    )
})