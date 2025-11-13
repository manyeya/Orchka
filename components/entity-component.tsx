import { Button } from "@/components/ui/button"
import { PlusIcon, SearchIcon } from "lucide-react"
import Link from "next/link"
import { Input } from "./ui/input"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

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
            {search}
                <div className="flex flex-col h-full gap-y-4 justify-center items-center">
        
                    {children}
                </div>
                {pagination}
            </div>
        </div>
    )
}

type EntitySearchProps = {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export const EntitySearch = ({
    value,
    onChange,
    placeholder
}: EntitySearchProps) => {
    return (
        <div className="relative ml-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4" />
            <Input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 pl-10 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>
    )
}

type EntityPaginationProps = {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    disabled?: boolean
}

export const EntityPagination = ({
    page,
    totalPages,
    onPageChange,
    disabled
}: EntityPaginationProps) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={() => onPageChange(page - 1)}
                        className={disabled || page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
                {pages.map((pageNum) => (
                    <PaginationItem key={pageNum}>
                        <PaginationLink
                            onClick={() => onPageChange(pageNum)}
                            isActive={pageNum === page}
                            className={disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        >
                            {pageNum}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                <PaginationItem>
                    <PaginationNext
                        onClick={() => onPageChange(page + 1)}
                        className={disabled || page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}
