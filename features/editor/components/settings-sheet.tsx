'use client'
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface SettingsSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export const SettingsSheet = ({ open, onOpenChange, children }: SettingsSheetProps) => {

    return (
        <Sheet open={open} onOpenChange={onOpenChange} >
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Settings</SheetTitle>
                    <SheetDescription>
                        Configure your Node
                    </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4">
                    <Separator />
                    {children}
                </div>
            </SheetContent>
        </Sheet>
    )
}
