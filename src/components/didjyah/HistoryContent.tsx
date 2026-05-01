import React, { useState, useMemo, useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { db } from "@/lib/db"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { CircleX, Trash, Filter, X, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useUndo, getEntityData } from "@/lib/undo"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type DidjyahRecordWithDidjyah = InstaQLEntity<
  AppSchema,
  "didjyahRecords",
  { didjyah: {}; owner: {} }
>

type Didjyah = InstaQLEntity<AppSchema, "didjyahs", {}>

const PAGE_SIZE = 20;

function parseSearchFromUrl(): {
    page: number
    didjyahIds: string[]
    startDate: string
    endDate: string
} {
    const params = new URLSearchParams(window.location.search)
    const page = parseInt(params.get("page") || "1", 10)
    const didjyahs = params.get("didjyahs")
    return {
        page: Number.isFinite(page) && page > 0 ? page : 1,
        didjyahIds: didjyahs ? didjyahs.split(",").filter(Boolean) : [],
        startDate: params.get("startDate") || "",
        endDate: params.get("endDate") || "",
    }
}

export function DidjyahHistoryContent() {
    const user = db.useUser()
    const navigate = useNavigate({ from: "/history" })
    const initial = parseSearchFromUrl()

    const [currentPage, setCurrentPage] = useState(initial.page)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
    const [selectedDidjyahIds, setSelectedDidjyahIds] = useState<string[]>(
        initial.didjyahIds,
    )
    const [dateRange, setDateRange] = useState<{
        startDate: string
        endDate: string
    }>({
        startDate: initial.startDate,
        endDate: initial.endDate,
    })
    const { registerAction } = useUndo()

    // Query for all user's didjyahs
    const { data: didjyahsData } = db.useQuery({
        didjyahs: {
            $: { where: { "owner.id": user.id } },
        },
    });

    const didjyahs = (didjyahsData?.didjyahs || []) as Didjyah[];

    useEffect(() => {
        void navigate({
            search: {
                page: currentPage > 1 ? currentPage : undefined,
                didjyahs:
                    selectedDidjyahIds.length > 0
                        ? selectedDidjyahIds.join(",")
                        : undefined,
                startDate: dateRange.startDate || undefined,
                endDate: dateRange.endDate || undefined,
            },
            replace: true,
        })
    }, [
        selectedDidjyahIds,
        dateRange.startDate,
        dateRange.endDate,
        currentPage,
        navigate,
    ])

    // Check if any filters are active
    const hasActiveFilters =
        selectedDidjyahIds.length > 0 ||
        dateRange.startDate !== "" ||
        dateRange.endDate !== "";

    // Query for paginated records (only when no filters are active)
    const { data, isLoading, error } = db.useQuery(
        !hasActiveFilters
            ? {
                  didjyahRecords: {
                      $: {
                          where: { "owner.id": user.id },
                          order: { createdDate: "desc" },
                          limit: PAGE_SIZE,
                          offset: (currentPage - 1) * PAGE_SIZE,
                      },
                      didjyah: {},
                  },
              }
            : null
    );

    // Query for total count (for pagination when no filters)
    const { data: countData } = db.useQuery(
        !hasActiveFilters
            ? {
                  didjyahRecords: {
                      $: {
                          where: { "owner.id": user.id },
                      },
                  },
              }
            : null
    );

    const records = (data?.didjyahRecords || []) as DidjyahRecordWithDidjyah[];
    const allRecords = (countData?.didjyahRecords || []) as DidjyahRecordWithDidjyah[];

    // For filters, we need to fetch all records and filter client-side
    const { data: filterData, isLoading: isLoadingFilters, error: filterError } = db.useQuery(
        hasActiveFilters
            ? {
                  didjyahRecords: {
                      $: {
                          where: { "owner.id": user.id },
                          order: { createdDate: "desc" },
                      },
                      didjyah: {},
                  },
              }
            : null
    );

    const filterRecords = (filterData?.didjyahRecords || []) as DidjyahRecordWithDidjyah[];
    
    // Combine loading states
    const isLoadingData = hasActiveFilters ? isLoadingFilters : isLoading;
    const errorData = hasActiveFilters ? filterError : error;

    // Apply all filters and pagination
    const displayRecords = useMemo(() => {
        let filtered: DidjyahRecordWithDidjyah[];

        if (hasActiveFilters) {
            filtered = filterRecords;
        } else {
            filtered = records;
        }

        // Apply didjyah filter
        if (selectedDidjyahIds.length > 0) {
            filtered = filtered.filter(
                (record) =>
                    record.didjyah?.id &&
                    selectedDidjyahIds.includes(record.didjyah.id)
            );
        }

        // Apply date range filter
        if (dateRange.startDate || dateRange.endDate) {
            filtered = filtered.filter((record) => {
                if (!record.createdDate) return false;

                const recordDate = new Date(record.createdDate);
                recordDate.setHours(0, 0, 0, 0);

                if (dateRange.startDate) {
                    const startDate = new Date(dateRange.startDate);
                    startDate.setHours(0, 0, 0, 0);
                    if (recordDate < startDate) return false;
                }

                if (dateRange.endDate) {
                    const endDate = new Date(dateRange.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    if (recordDate > endDate) return false;
                }

                return true;
            });
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        return filtered.slice(startIndex, startIndex + PAGE_SIZE);
    }, [
        hasActiveFilters,
        records,
        filterRecords,
        selectedDidjyahIds,
        dateRange.startDate,
        dateRange.endDate,
        currentPage,
    ]);

    // Calculate total records for pagination
    const totalRecords = useMemo(() => {
        if (!hasActiveFilters) {
            return allRecords.length;
        }

        let filtered = filterRecords;

        if (selectedDidjyahIds.length > 0) {
            filtered = filtered.filter(
                (record) =>
                    record.didjyah?.id &&
                    selectedDidjyahIds.includes(record.didjyah.id)
            );
        }

        if (dateRange.startDate || dateRange.endDate) {
            filtered = filtered.filter((record) => {
                if (!record.createdDate) return false

                const recordDate = new Date(record.createdDate)
                recordDate.setHours(0, 0, 0, 0)

                if (dateRange.startDate) {
                    const startDate = new Date(dateRange.startDate)
                    startDate.setHours(0, 0, 0, 0)
                    if (recordDate < startDate) return false
                }

                if (dateRange.endDate) {
                    const endDate = new Date(dateRange.endDate)
                    endDate.setHours(23, 59, 59, 999)
                    if (recordDate > endDate) return false
                }

                return true
            })
        }

        return filtered.length
    }, [
        hasActiveFilters,
        allRecords,
        filterRecords,
        selectedDidjyahIds,
        dateRange.startDate,
        dateRange.endDate,
    ])

    const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

    const handleDelete = async (recordId: string) => {
        try {
            const allRecordsToSearch = hasActiveFilters ? filterRecords : allRecords;
            const record = allRecordsToSearch.find((r) => r.id === recordId);
            if (!record) return;

            // Get previous data for undo
            const previousData = await getEntityData("didjyahRecords", recordId);
            const didjyahId = record.didjyah?.id;
            const ownerId = record.owner?.id;

            await db.transact(db.tx.didjyahRecords[recordId].delete());
            setDeleteDialogOpen(null);

            if (previousData && didjyahId && ownerId) {
                registerAction({
                    type: "delete",
                    entityType: "didjyahRecords",
                    entityId: recordId,
                    previousData,
                    links: { didjyah: didjyahId, owner: ownerId },
                    message: `Record deleted from "${record.didjyah?.name || "DidjYah"}"`,
                });
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "An error occurred while deleting the record.";
            toast.error(message);
        }
    };

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return "Unknown date";
        const date = new Date(timestamp);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const handleDidjyahToggle = (didjyahId: string) => {
        setCurrentPage(1)
        setSelectedDidjyahIds((prev) =>
            prev.includes(didjyahId)
                ? prev.filter((id) => id !== didjyahId)
                : [...prev, didjyahId],
        )
    }

    const handleSelectAllDidjyahs = () => {
        setCurrentPage(1)
        if (selectedDidjyahIds.length === didjyahs.length) {
            setSelectedDidjyahIds([])
        } else {
            setSelectedDidjyahIds(didjyahs.map((d) => d.id))
        }
    }

    const handleClearFilters = () => {
        setSelectedDidjyahIds([]);
        setDateRange({ startDate: "", endDate: "" });
        setCurrentPage(1);
    };

    const activeFilterCount =
        (selectedDidjyahIds.length > 0 ? 1 : 0) +
        (dateRange.startDate || dateRange.endDate ? 1 : 0);

    if (isLoadingData) {
        return (
            <div className="m-auto flex w-full max-w-4xl items-center justify-center lg:min-w-3xl">
                <Skeleton className="h-8 w-32" />
            </div>
        );
    }

    if (errorData) {
        return (
            <div className="m-auto flex h-auto w-full items-center justify-center">
                <div className="max-w-5xl px-4">
                    <Alert
                        variant="destructive"
                        className="flex w-full items-center gap-4"
                    >
                        <CircleX
                            className="shrink-0"
                            style={{ width: "36px", height: "36px" }}
                        />
                        <div className="w-full">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {errorData instanceof Error
                                    ? errorData.message
                                    : "An error occurred"}
                            </AlertDescription>
                        </div>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <main className="p-2 md:p-4">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <h1 className="mb-4 text-2xl font-bold">
                        DidjYah Records History
                    </h1>

                    {/* Filters Section */}
                    <div className="mb-4 space-y-4">
                        <div className="flex flex-wrap items-end gap-4">
                            {/* Didjyah Multi-Select Dropdown */}
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="didjyah-filter" className="mb-2 block text-sm">
                                    Filter by DidjYah
                                </Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                            id="didjyah-filter"
                                        >
                                            <span className="truncate">
                                                {selectedDidjyahIds.length === 0
                                                    ? "All Didjyahs"
                                                    : selectedDidjyahIds.length === 1
                                                    ? didjyahs.find(
                                                          (d) =>
                                                              d.id ===
                                                              selectedDidjyahIds[0]
                                                      )?.name || "1 DidjYah"
                                                    : `${selectedDidjyahIds.length} Didjyahs selected`}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[200px]">
                                        <DropdownMenuLabel>
                                            Select Didjyahs
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuCheckboxItem
                                            checked={
                                                selectedDidjyahIds.length ===
                                                didjyahs.length &&
                                                didjyahs.length > 0
                                            }
                                            onCheckedChange={
                                                handleSelectAllDidjyahs
                                            }
                                        >
                                            Select All
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuSeparator />
                                        {didjyahs.map((didjyah) => (
                                            <DropdownMenuCheckboxItem
                                                key={didjyah.id}
                                                checked={selectedDidjyahIds.includes(
                                                    didjyah.id
                                                )}
                                                onCheckedChange={() =>
                                                    handleDidjyahToggle(
                                                        didjyah.id
                                                    )
                                                }
                                            >
                                                {didjyah.name}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Date Range Filter */}
                            <div className="flex-1 min-w-[200px]">
                                <div className="flex flex-col gap-2 md:flex-row md:gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="date-from" className="mb-2 block text-sm">
                                            From Date
                                        </Label>
                                        <Input
                                            id="date-from"
                                            type="date"
                                            placeholder="From"
                                            value={dateRange.startDate}
                                            onChange={(e) => {
                                                setCurrentPage(1)
                                                setDateRange((prev) => ({
                                                    ...prev,
                                                    startDate: e.target.value,
                                                }))
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor="date-to" className="mb-2 block text-sm">
                                            To Date
                                        </Label>
                                        <Input
                                            id="date-to"
                                            type="date"
                                            placeholder="To"
                                            value={dateRange.endDate}
                                            onChange={(e) => {
                                                setCurrentPage(1)
                                                setDateRange((prev) => ({
                                                    ...prev,
                                                    endDate: e.target.value,
                                                }))
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Clear Filters Button */}
                            {activeFilterCount > 0 && (
                                <div>
                                    <Button
                                        variant="outline"
                                        onClick={handleClearFilters}
                                        className="whitespace-nowrap"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Active Filters Indicator */}
                        {activeFilterCount > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Filter className="h-4 w-4" />
                                <span>
                                    {activeFilterCount} filter
                                    {activeFilterCount !== 1 ? "s" : ""} active
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {displayRecords.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-800">
                        <p className="text-muted-foreground">
                            {hasActiveFilters
                                ? "No records found matching your filters"
                                : "No records found"}
                        </p>
                        {hasActiveFilters && (
                            <Button
                                variant="link"
                                onClick={handleClearFilters}
                                className="mt-2"
                            >
                                Clear all filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {displayRecords.map((record) => (
                            <div
                                key={record.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                            >
                                <div className="flex-1">
                                    <h3 className="font-semibold">
                                        {record.didjyah?.name || "Unknown DidjYah"}
                                    </h3>
                                    <div className="mt-1 space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Created: {formatDate(record.createdDate)}
                                        </p>
                                        {record.endDate && (
                                            <p className="text-sm text-muted-foreground">
                                                Ended: {formatDate(record.endDate)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setDeleteDialogOpen(record.id)
                                        }
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog
                                        open={deleteDialogOpen === record.id}
                                        onOpenChange={(open) =>
                                            setDeleteDialogOpen(
                                                open ? record.id : null
                                            )
                                        }
                                    >
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Delete Record?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to
                                                    delete this record from{" "}
                                                    <b>
                                                        {record.didjyah?.name ||
                                                            "DidjYah"}
                                                    </b>
                                                    ? This action cannot be
                                                    undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        handleDelete(record.id)
                                                    }
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage > 1) {
                                                        setCurrentPage(
                                                            currentPage - 1
                                                        );
                                                        window.scrollTo({
                                                            top: 0,
                                                            behavior: "smooth",
                                                        });
                                                    }
                                                }}
                                                className={
                                                    currentPage === 1
                                                        ? "pointer-events-none opacity-50"
                                                        : "cursor-pointer"
                                                }
                                            />
                                        </PaginationItem>

                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => i + 1
                                        )
                                            .filter((page) => {
                                                // Show first page, last page, current page, and pages around current
                                                if (page === 1) return true;
                                                if (page === totalPages)
                                                    return true;
                                                if (
                                                    Math.abs(page - currentPage) <=
                                                    1
                                                )
                                                    return true;
                                                return false;
                                            })
                                            .map((page, index, array) => {
                                                // Add ellipsis between non-consecutive pages
                                                const showEllipsisBefore =
                                                    index > 0 &&
                                                    array[index - 1] !== page - 1;
                                                return (
                                                    <React.Fragment key={page}>
                                                        {showEllipsisBefore && (
                                                            <PaginationItem>
                                                                <PaginationEllipsis />
                                                            </PaginationItem>
                                                        )}
                                                        <PaginationItem>
                                                            <PaginationLink
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setCurrentPage(
                                                                        page
                                                                    );
                                                                    window.scrollTo(
                                                                        {
                                                                            top: 0,
                                                                            behavior:
                                                                                "smooth",
                                                                        }
                                                                    );
                                                                }}
                                                                isActive={
                                                                    currentPage ===
                                                                    page
                                                                }
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    </React.Fragment>
                                                );
                                            })}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (
                                                        currentPage < totalPages
                                                    ) {
                                                        setCurrentPage(
                                                            currentPage + 1
                                                        );
                                                        window.scrollTo({
                                                            top: 0,
                                                            behavior: "smooth",
                                                        });
                                                    }
                                                }}
                                                className={
                                                    currentPage === totalPages
                                                        ? "pointer-events-none opacity-50"
                                                        : "cursor-pointer"
                                                }
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}

                        <div className="mt-4 text-sm text-muted-foreground">
                            Showing {displayRecords.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to{" "}
                            {Math.min(
                                currentPage * PAGE_SIZE,
                                totalRecords
                            )}{" "}
                            of {totalRecords} records
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

