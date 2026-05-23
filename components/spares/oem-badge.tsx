import { Badge } from "@/components/ui/badge";
import { OEM } from "@/lib/types";

export function OemBadge({ oem }: { oem: OEM | null | undefined }) {
  if (!oem) return <span className="text-muted-foreground text-xs">—</span>;
  if (oem === "ABB") return <Badge variant="abb">ABB</Badge>;
  if (oem === "TAKRAF") return <Badge variant="takraf">TAKRAF</Badge>;
  return <Badge variant="secondary">{oem}</Badge>;
}
