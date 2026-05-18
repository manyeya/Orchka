"use client"

import { Button } from "@orchka/ui/button"
import { AlertTriangle, AlertTriangleIcon, ArrowUpRight, DotSquareIcon, FileExclamationPointIcon, FolderCode, Loader2Icon, MoreVerticalIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react"
import Link from "next/link"
import { Input } from "@orchka/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@orchka/ui/tooltip"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@orchka/ui/pagination"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@orchka/ui/popover"
import { useState } from "react"
import { Spinner } from "@orchka/ui/spinner"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@orchka/ui/empty"
import { cn } from "@orchka/ui/utils"

import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemHeader, ItemMedia, ItemTitle } from "@orchka/ui/item"
import { Avatar, AvatarFallback, AvatarImage } from "@orchka/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@orchka/ui/dropdown-menu"


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
    /** Optional: total item count, enables an "X–Y of N" summary. */
    count?: number
    /** Optional: page size, used with `count` to compute the summary range. */
    pageSize?: number
    /** Pages shown on each side of the current page. Defaults to 1. */
    siblingCount?: number
}

/**
 * Build the page list with ellipsis markers. Returns an array of either a
 * page number or the literal "ellipsis" sentinel. Sized O(siblingCount), not
 * O(totalPages), so this is safe for thousands of pages.
 */
function buildPageWindow(
    current: number,
    total: number,
    siblingCount: number,
): Array<number | "ellipsis"> {
    const boundary = 1
    // Slot count for the "no ellipsis needed" short-circuit.
    const totalNumbers = siblingCount * 2 + 3 + boundary * 2

    if (totalNumbers >= total) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const leftSibling = Math.max(current - siblingCount, 1)
    const rightSibling = Math.min(current + siblingCount, total)

    const showLeftEllipsis = leftSibling > boundary + 2
    const showRightEllipsis = rightSibling < total - boundary - 1

    const result: Array<number | "ellipsis"> = []

    if (!showLeftEllipsis && showRightEllipsis) {
        const leftItemCount = 3 + 2 * siblingCount
        for (let i = 1; i <= leftItemCount; i++) result.push(i)
        result.push("ellipsis")
        result.push(total)
    } else if (showLeftEllipsis && !showRightEllipsis) {
        const rightItemCount = 3 + 2 * siblingCount
        result.push(1)
        result.push("ellipsis")
        for (let i = total - rightItemCount + 1; i <= total; i++) result.push(i)
    } else {
        result.push(1)
        result.push("ellipsis")
        for (let i = leftSibling; i <= rightSibling; i++) result.push(i)
        result.push("ellipsis")
        result.push(total)
    }

    return result
}

function JumpToPagePopover({
    page,
    totalPages,
    disabled,
    onPageChange,
}: Pick<EntityPaginationProps, "page" | "totalPages" | "disabled" | "onPageChange">) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

    const commit = () => {
        const parsed = parseInt(value, 10)
        if (!Number.isFinite(parsed)) return
        const clamped = Math.min(Math.max(parsed, 1), totalPages)
        if (clamped !== page) onPageChange(clamped)
        setOpen(false)
        setValue("")
    }

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                if (disabled) return
                setOpen(next)
                if (!next) setValue("")
            }}
        >
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    aria-label="Jump to page"
                    className="flex size-9 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <PaginationEllipsis className="size-9" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="center"
                sideOffset={6}
                className="w-auto p-2"
            >
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        go to
                    </span>
                    <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        autoFocus
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                commit()
                            } else if (e.key === "Escape") {
                                setOpen(false)
                                setValue("")
                            }
                        }}
                        placeholder={`1–${totalPages}`}
                        className="h-8 w-24 font-mono text-xs tabular-nums"
                    />
                    <Button
                        type="button"
                        size="sm"
                        className="h-8 font-mono text-[10px] uppercase tracking-[0.18em]"
                        onClick={commit}
                    >
                        go
                    </Button>
                </div>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    page {page} of {totalPages.toLocaleString()}
                </p>
            </PopoverContent>
        </Popover>
    )
}

export const EntityPagination = ({
    page,
    totalPages,
    onPageChange,
    disabled,
    count,
    pageSize,
    siblingCount = 1,
}: EntityPaginationProps) => {
    if (totalPages <= 1) return null

    const safePage = Math.min(Math.max(page, 1), totalPages)
    const isFirst = safePage === 1
    const isLast = safePage === totalPages
    const window = buildPageWindow(safePage, totalPages, siblingCount)

    const summary =
        count != null && pageSize != null
            ? (() => {
                const start = (safePage - 1) * pageSize + 1
                const end = Math.min(safePage * pageSize, count)
                return `${start.toLocaleString()}–${end.toLocaleString()} of ${count.toLocaleString()}`
            })()
            : `Page ${safePage.toLocaleString()} of ${totalPages.toLocaleString()}`

    const navClass = cn(
        "flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between",
        disabled && "pointer-events-none opacity-60",
    )

    return (
        <nav aria-label="Pagination" className={navClass}>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground tabular-nums">
                {summary}
            </span>

            <Pagination className="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => !isFirst && onPageChange(safePage - 1)}
                            aria-disabled={isFirst}
                            tabIndex={isFirst ? -1 : 0}
                            className={cn(
                                "h-9 font-mono text-xs uppercase tracking-[0.16em]",
                                isFirst
                                    ? "pointer-events-none opacity-40"
                                    : "cursor-pointer",
                            )}
                        />
                    </PaginationItem>

                    {/* Compact label for narrow viewports — replaces the page chips. */}
                    <PaginationItem className="sm:hidden">
                        <span className="flex h-9 items-center px-3 font-mono text-xs tabular-nums text-muted-foreground">
                            {safePage} / {totalPages}
                        </span>
                    </PaginationItem>

                    {window.map((entry, i) =>
                        entry === "ellipsis" ? (
                            <PaginationItem key={`gap-${i}`} className="hidden sm:flex">
                                <JumpToPagePopover
                                    page={safePage}
                                    totalPages={totalPages}
                                    disabled={disabled}
                                    onPageChange={onPageChange}
                                />
                            </PaginationItem>
                        ) : (
                            <PaginationItem key={entry} className="hidden sm:flex">
                                <PaginationLink
                                    onClick={() => entry !== safePage && onPageChange(entry)}
                                    isActive={entry === safePage}
                                    aria-current={entry === safePage ? "page" : undefined}
                                    className={cn(
                                        "h-9 min-w-9 cursor-pointer font-mono text-xs tabular-nums",
                                        entry === safePage &&
                                        "border-primary/40 bg-primary/10 text-primary",
                                    )}
                                >
                                    {entry}
                                </PaginationLink>
                            </PaginationItem>
                        ),
                    )}

                    <PaginationItem>
                        <PaginationNext
                            onClick={() => !isLast && onPageChange(safePage + 1)}
                            aria-disabled={isLast}
                            tabIndex={isLast ? -1 : 0}
                            className={cn(
                                "h-9 font-mono text-xs uppercase tracking-[0.16em]",
                                isLast
                                    ? "pointer-events-none opacity-40"
                                    : "cursor-pointer",
                            )}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </nav>
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