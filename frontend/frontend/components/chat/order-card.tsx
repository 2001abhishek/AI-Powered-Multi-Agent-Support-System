
import { Package, Truck, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function OrderCard({ data }: { data: any }) {
    if (!data) return null;

    return (
        <Card className="w-full max-w-sm mt-3 bg-card/60 backdrop-blur border-orange-500/30 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-amber-500" />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="w-4 h-4 text-orange-400" />
                            Order {data.id}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Expected Delivery: {data.eta}
                        </CardDescription>
                    </div>
                    <div className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium flex items-center gap-1 border border-orange-500/20">
                        <Truck className="w-3 h-3" />
                        {data.status}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-sm">
                <div className="space-y-2">
                    {data.items?.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-muted-foreground p-2 rounded-md bg-muted/40">
                            <div className="w-1 h-1 rounded-full bg-orange-500/50" />
                            {item}
                        </div>
                    ))}
                    <div className="pt-2 border-t flex justify-between font-medium">
                        <span>Total</span>
                        <span>{data.total}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
