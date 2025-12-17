import { Button } from "@/components/ui/button"
import { AlertTriangle, AlertTriangleIcon, ArrowUpRight, DotSquareIcon, FileExclamationPointIcon, FolderCode, Loader2Icon, MoreVerticalIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react"
import Link from "next/link"
import { Input } from "./ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Spinner } from "./ui/spinner"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty"
import { cn } from "@/lib/utils"

import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemHeader, ItemMedia, ItemTitle } from "./ui/item"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"


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

interface StateViewProps {
    message?: string
}

interface LoadingViewProps extends StateViewProps {
    entity?: string
}


export const LoadingView = ({ message, entity }: LoadingViewProps) => {
    return (
        <Empty className="h-full">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Loader2Icon className="animate-spin" />
                </EmptyMedia>
                <EmptyTitle>{message || `Loading ${entity}`}</EmptyTitle>
                <EmptyDescription>Please wait...</EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}

interface EntityLoaderProps {
    title?: string
    description?: string
}

export const EntityLoader = ({ title = "Loading", description = "Please wait..." }: EntityLoaderProps) => {
    return (
        <Empty className="h-full">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Loader2Icon className="animate-spin" />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}

interface EmptyViewProps extends StateViewProps {
    entity?: string
    description?: string
    isPending?: boolean
    canBeImported?: boolean
    onNew?: () => void
    icon: React.ReactNode
}

export const EmptyView = ({ message, icon, entity, isPending, canBeImported, onNew }: EmptyViewProps) => {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    {icon}
                </EmptyMedia>
                <EmptyTitle>{message || `No ${entity} Yet`}</EmptyTitle>
                <EmptyDescription>
                    {message || `You havent created any ${entity} yet. Get started by creating
                    your first ${entity}.`}
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <div className="flex gap-2">
                    <Button disabled={isPending} onClick={onNew}>Create {entity}</Button>
                    {canBeImported && <Button variant="outline">Import {entity}</Button>}
                </div>
            </EmptyContent>
            <Button
                variant="link"
                asChild
                className="text-muted-foreground"
                size="sm"
            >
                <Link href="#">
                    Learn More <ArrowUpRight />
                </Link>
            </Button>
        </Empty>
    )
}

interface ErrorViewProps extends StateViewProps {
    entity?: string
}

export const ErrorView = ({ message, entity }: ErrorViewProps) => {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <AlertTriangleIcon />
                </EmptyMedia>
                <EmptyTitle>{message || `Error loading ${entity}`}</EmptyTitle>
                <EmptyDescription>
                    {message || `Something went wrong while loading ${entity}. Please try again.`}
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}


interface EntityListProps<T> {
    items: T[]
    render: (item: T, index: number) => React.ReactNode
    getKey: (item: T, index: number) => string | number
    emptyView?: React.ReactNode
    className?: string
}

export const EntityList = <T,>({
    items,
    render,
    getKey,
    emptyView,
    className
}: EntityListProps<T>) => {
    if (items.length === 0 && emptyView) {
        return (
            <div className="flex-1 flex justify-center items-center">
                <div className="max-w-sm mx-auto">
                    {emptyView}
                </div>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col gap-y-4", className)}>
            {items.map((item, index) => (
                <div key={getKey ? getKey(item, index) : index}>{render(item, index)}</div>
            ))}
        </div>
    )
}


interface EntityItemProps {
    href: string
    title: string
    subtitle?: React.ReactNode
    image?: string
    actions?: React.ReactNode
    onRemove?: () => void | Promise<void>
    isRemoving?: boolean
    className?: string
}

export const EntityItem = ({
    href,
    title,
    subtitle,
    image,
    actions,
    onRemove,
    isRemoving,
    className
}: EntityItemProps) => {

    const handleRemove = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isRemoving) return
        if (onRemove) {
            await onRemove()
        }
    }
    return (
        <div className="flex w-full max-w-lg flex-col gap-6">
            <Item asChild>
                <Link href={href} prefetch>
                    <ItemMedia>
                        <Avatar className="size-10">
                            {image?.startsWith('http') && <AvatarImage src={image} />}
                            <AvatarFallback>{title.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle>{title}</ItemTitle>
                        <ItemDescription>{subtitle}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        {actions}
                        {onRemove && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                                        <MoreVerticalIcon />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleRemove}>
                                        <TrashIcon />
                                        Remove
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </ItemActions>
                </Link>
            </Item>
        </div>
    )
}

interface EntityTooltipProps {
    children: React.ReactNode
    content: React.ReactNode
    side?: "top" | "right" | "bottom" | "left"
}

export const AppTooltip = ({
    children,
    content,
    side = "bottom"
}: EntityTooltipProps) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {children}
            </TooltipTrigger>
            <TooltipContent side={side} className="text-xs">
                {content}
            </TooltipContent>
        </Tooltip>
    )
}