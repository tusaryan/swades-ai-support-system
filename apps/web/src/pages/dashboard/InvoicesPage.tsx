import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Receipt } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Invoice {
    id: string;
    invoiceNumber: string;
    status: string;
    amount: number;
    createdAt: string;
    dueDate: string;
    refundStatus?: string;
    paymentMethod?: string;
}

export default function InvoicesPage() {
    const { token } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/billing`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setInvoices(data);
                }
            } catch (error) {
                console.error("Failed to fetch invoices", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchInvoices();
        }
    }, [token]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'overdue': case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'refunded': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getRefundColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'none': return 'text-muted-foreground';
            case 'requested': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default: return 'text-muted-foreground';
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
                <p className="text-muted-foreground">Manage your billing and view invoices.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>
                        View your recent transactions and download invoices.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">No invoices</h3>
                            <p className="text-muted-foreground mt-1">You have no invoices to display.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Refund</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                            <TableCell>
                                                {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                                                    {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {invoice.refundStatus && invoice.refundStatus !== 'none' ? (
                                                    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRefundColor(invoice.refundStatus)}`}>
                                                        {invoice.refundStatus.charAt(0).toUpperCase() + invoice.refundStatus.slice(1)}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {invoice.paymentMethod ? (
                                                    <span className="text-xs">{invoice.paymentMethod}</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ${typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : invoice.amount}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Download className="h-4 w-4" />
                                                    <span className="sr-only">Download</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
