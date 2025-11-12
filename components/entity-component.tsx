import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import Link from "next/link"

type EntityHeaderProps = {
    title: string
    description?: string
    newButtonLabel: string
    disabled?: boolean
    isCreating?: boolean
} & (
        { onNew: () => void; newButtonHref?: never }
        | { newButtonHref: string; onNew?: never }
        | { onNew?: never; newButtonHref: string }
    )

export const EntityHeader = ({
    title,
    description,
    newButtonLabel,
    disabled,
    isCreating,
    onNew,
    newButtonHref
}: EntityHeaderProps) => {
    return (
        <div className="flex flex-row items-center justify-between gap-x-4">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <div>
                {onNew && !newButtonHref && (
                    <Button
                        onClick={onNew}
                        disabled={disabled || isCreating}
                    >
                        <PlusIcon className="size-4" />
                        {newButtonLabel}
                    </Button>
                )}
                {!onNew && newButtonHref && (
                    <Button
                        asChild
                        disabled={disabled || isCreating}
                    >
                        <Link href={newButtonHref} prefetch>
                            <PlusIcon className="size-4" />
                            {newButtonLabel}
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    )
}

EntityHeader.displayName = "EntityHeader"


type EntityContainerProps = {
    children: React.ReactNode
    header?: React.ReactNode
    search?: React.ReactNode
    pagination?: React.ReactNode
}

export const EntityContainer = ({
    children,
    header,
    search,
    pagination
}: EntityContainerProps) => {
    return (
        <div className="p-4 md:px-10 md:py-6 h-full">
            <div className="mx-auto max-w-screen-7xl w-full flex flex-col h-full gap-y-8">
                {header}

                <div className="flex flex-col h-full gap-y-4 justify-center items-center">
                    {search}
                    {children}
                </div>
                {pagination}
            </div>
        </div>
    )
}

