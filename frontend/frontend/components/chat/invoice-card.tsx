
import { Receipt, Download, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function InvoiceCard({ data }: { data: any }) {
    if (!data) return null;

    return (
        <Card className="w-full max-w-sm mt-3 bg-card/60 backdrop-blur border-green-500/30 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-green-400" />
                            Invoice {data.id}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Date: {data.date}
                        </CardDescription>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium flex items-center gap-1 border border-green-500/20">
                        <CreditCard className="w-3 h-3" />
                        {data.status}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
                <div className="space-y-2">
                    {data.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-muted-foreground">
                            <span>{item.desc}</span>
                            <span>{item.amount}</span>
                        </div>
                    ))}
                </div>
                <div className="pt-2 border-t flex justify-between font-bold text-base">
                    <span>Total Paid</span>
                    <span className="text-green-400">{data.amount}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs h-8 border-green-500/30 hover:bg-green-500/10 hover:text-green-400">
                    <Download className="w-3 h-3 mr-2" />
                    Download PDF
                </Button>
            </CardContent>
        </Card>
    );
}
